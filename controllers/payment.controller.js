import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { OrderDetails, Cart } from "../models/Order.js";

// Paystack secret key
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export const initializePayment = async (req, res) => {
  const {
    email,
    amount,
    shippingAddress,
    paymentMethod = "Paystack",
    totalPrice,
    finalPrice,
    deliveryDate,
  } = req.body;

  // Convert KES to cents (100 cents = 1 KES)
  const amountInCents = amount * 100;

  try {
    const { userId } = req.user;

    // Validate user cart
    const userCart = await Cart.findOne({ user: userId }).populate(
      "items.productId"
    );

    if (!userCart || !userCart.items.length) {
      return res
        .status(400)
        .json({ message: "User cart is empty or not found" });
    }

    const invalidItems = userCart.items.filter(
      (item) => !item.productId || !item.productId._id
    );

    if (invalidItems.length) {
      return res.status(400).json({ message: "Some cart items are invalid" });
    }

    // Prepare cart items for the order
    const cartItems = userCart.items.map((item) => ({
      productId: item.productId._id,
      quantity: item.quantity,
      name: item.productId.name,
      price: item.productId.price,
    }));

    // Initialize Paystack payment
    const paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amountInCents,
        callback_url: "http://localhost:3000/verify-payment", // Adjust as per deployment
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { authorization_url, reference } = paystackResponse.data.data;

    // Create an order in the database
    const orderId = uuidv4(); // Generate unique order ID
    const shipping = {
      fullName: shippingAddress.fullName || "N/A",
      address: shippingAddress.address || "N/A",
      phone: shippingAddress.phone || "N/A",
      country: shippingAddress.country || "N/A",
      city: shippingAddress.city || "N/A",
      postalCode: shippingAddress.postalCode || "N/A",
      deliveryDate,
    };

    const payment = {
      method: paymentMethod,
      status: "pending", // Initial status
      transactionId: reference,
    };

    const order = new OrderDetails({
      orderId,
      items: cartItems,
      totalPrice,
      discountApplied: 0, // Adjust as needed
      finalPrice,
      status: "payment pending",
      payment,
      shipping,
      user: userId,
      orderDate: new Date(),
      lastUpdated: new Date(),
    });

    await order.save();

    // Clear the user's cart
    userCart.items = [];
    await userCart.save();

    return res.status(200).json({
      authorization_url,
      orderId,
    });
  } catch (error) {
    console.error("Error initializing payment:", error.message);
    res
      .status(500)
      .json({ message: "Server error during payment initialization" });
  }
};

// Verify Payment Function
export const verifyPayment = async (req, res) => {
  const { reference, orderId } = req.body;

  try {
    if (!reference || !orderId) {
      return res
        .status(400)
        .json({ message: "Missing payment reference or order ID" });
    }

    // Verify payment with Paystack
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const { status, data } = paystackResponse.data;

    if (status && data.status === "success") {
      // Locate the order in the database
      const order = await OrderDetails.findOne({ orderId });

      if (!order) {
        return res
          .status(404)
          .json({ message: "Order not found for the given order ID" });
      }

      // Update the order details
      order.payment.status = "completed";
      order.payment.transactionId = reference;
      order.status = "pending delivery"; // Update to next status
      order.lastUpdated = new Date();

      await order.save();

      return res.status(200).json({
        message: "Payment verified successfully",
        order,
        status: order.status,
      });
    } else {
      return res.status(400).json({
        message: data.message || "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error.message);
    res
      .status(500)
      .json({ message: "Server error during payment verification" });
  }
};
