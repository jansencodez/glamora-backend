const { OrderDetails, Cart } = require("../models/Order");
const Product = require("../models/Product");
// Get Order by ID Controller
const mongoose = require("mongoose");

const { v4: uuidv4 } = require("uuid");
exports.createOrder = async (req, res) => {
  const {
    shippingAddress,
    paymentMethod,
    totalPrice,
    finalPrice,
    deliveryDate,
  } = req.body;
  const { userId } = req.user; // Assuming the user's ID is available in req.user (via authentication middleware)

  try {
    // Fetch the user's cart
    const userCart = await Cart.findOne({ user: userId }).populate(
      "items.productId"
    );
    if (!userCart || !userCart.items.length) {
      return res
        .status(400)
        .json({ message: "User cart is empty or not found" });
    }

    // Validate cart items
    const invalidItems = userCart.items.filter(
      (item) => !item.productId || !item.productId._id
    );
    if (invalidItems.length) {
      return res.status(400).json({ message: "Some cart items are invalid" });
    }

    const orderId = uuidv4();

    // Prepare items for the order
    const cartItems = userCart.items.map((item) => ({
      productId: item.productId._id,
      quantity: item.quantity,
      name: item.name,
      price: item.productId.price,
    }));

    // Build the shipping object
    const shipping = {
      fullName: shippingAddress.fullName,
      address: shippingAddress.address,
      phone: shippingAddress.phone,
      country: shippingAddress.country || "",
      city: shippingAddress.city || "",
      postalCode: shippingAddress.postalCode || "",
      deliveryDate,
    };

    // Build the payment object
    const payment = {
      method: paymentMethod,
      status: "pending",
      transactionId: "", // Will be updated after payment processing
    };

    // Create the order
    const order = new OrderDetails({
      orderId,
      items: cartItems,
      totalPrice,
      discountApplied: 0, // Default value
      finalPrice,
      status: "pending", // Default status
      payment,
      shipping,
      user: userId,
      orderDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    });

    await order.save();

    // Clear the user's cart after order creation
    userCart.items = [];
    await userCart.save();

    return res
      .status(201)
      .json({ message: "Order created successfully", orderId: orderId, order });
  } catch (error) {
    console.error("Error creating order:", error);
    return res
      .status(500)
      .json({ message: error.message || "Error creating order" });
  }
};

exports.getOrderById = async (req, res) => {
  const { orderId } = req.params;

  try {
    // Find the order and populate fields
    const order = await OrderDetails.findOne({ orderId })
      .populate({
        path: "items.productId",
        model: "Product", // Ensure this matches your Product model name
      })
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Convert order items with price as a number
    const orderWithPriceAsNumber = {
      ...order.toObject(),
      items: order.items.map((item) => {
        if (!item) return item; // Ensure item exists
        const itemObj = { ...item.toObject() }; // Convert to plain object
        if (itemObj.price instanceof mongoose.Types.Decimal128) {
          itemObj.price = parseFloat(itemObj.price.toString());
        }
        return itemObj;
      }),
    };

    return res.status(200).json({ order: orderWithPriceAsNumber });
  } catch (error) {
    console.error("Error fetching order:", error.message, error.stack);
    return res
      .status(500)
      .json({ message: "Error fetching order", error: error.message });
  }
};

// Update Order Status Controller
exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const order = await OrderDetails.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    order.lastUpdated = new Date().toISOString();

    await order.save();

    // Optionally populate the user field to return user details along with the order
    await order.populate("user", "name email");

    return res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Error updating order status" });
  }
};

// Get All Orders Controller (Admin functionality)
exports.getAllOrders = async (req, res) => {
  try {
    // Fetch all orders and populate the product details, including imageUrls
    const orders = await OrderDetails.find()
      .populate({
        path: "items.productId", // Path to the referenced product
        model: "Product",
        select: "imageUrls",
      })
      .populate("user", "name email");
    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Error fetching orders" });
  }
};
