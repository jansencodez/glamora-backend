const { Cart } = require("../models/Order");
const mongoose = require("mongoose");

exports.createCart = async (req, res) => {
  try {
    const { userId } = req.user;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }

    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Error creating cart", error });
  }
};

// Add Item to Cart

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity, name, price, imageUrls } = req.body;
    const { userId } = req.user;

    console.log(req.body);
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex > -1) {
      // Update quantity if the product already exists in the cart
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Add new product to the cart
      cart.items.push({ productId, quantity, name, price, imageUrls });
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Error adding to cart", error });
  }
};

// Update Item in Cart
exports.updateCartItem = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId, quantity } = req.body;

    if (quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 0" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((item) => item._id.toString() === productId);
    if (item) {
      item.quantity = quantity;
      await cart.save();

      const cartWithPriceAsNumber = {
        ...cart.toObject(), // Convert the Mongoose document to plain object
        items: cart.items.map((item) => {
          // Make sure the item is a valid object and convert price
          const itemObj = { ...item._doc }; // Ensure the item is converted into a plain object if it's a Mongoose document
          if (itemObj.price instanceof mongoose.Types.Decimal128) {
            itemObj.price = parseFloat(itemObj.price.toString()); // Convert Decimal128 to a number
          }
          return itemObj;
        }),
      };
      res.status(200).json({
        message: "Cart updated successfully",
        items: cartWithPriceAsNumber.items,
      });
    } else {
      res.status(404).json({ message: "Product not found in cart" });
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Error updating cart", error });
  }
};

// Remove Item from Cart
exports.removeFromCart = async (req, res) => {
  try {
    const { userId } = req.user; // Assuming userId is set via authentication middleware
    const { id } = req.params; // The product ID from the request params

    // Find the user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Filter the cart items to remove the product
    const originalCartLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== id.toString() // Assuming the field is product._id
    );

    // If no items were removed, return a message
    if (cart.items.length === originalCartLength) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // If the cart is now empty, handle the empty cart scenario
    if (cart.items.length === 0) {
      cart.status = "empty"; // Optional: If you want to set a status for empty carts
    }

    // Save the updated cart
    await cart.save();

    // Return the updated cart
    res.status(200).json(cart);
  } catch (error) {
    // Log the error for debugging
    console.error("Error removing item from cart:", error);
    res.status(500).json({ message: "Error removing item from cart", error });
  }
};

// Get All Items in Cart
exports.getCart = async (req, res) => {
  try {
    const { userId } = req.user;

    // Fetch the cart without using populate, just get the items
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // Map through cart items and safely convert the price from Decimal128 to number
    const cartWithPriceAsNumber = {
      ...cart.toObject(), // Convert the Mongoose document to plain object
      items: cart.items.map((item) => {
        // Make sure the item is a valid object and convert price
        const itemObj = { ...item._doc }; // Ensure the item is converted into a plain object if it's a Mongoose document
        if (itemObj.price instanceof mongoose.Types.Decimal128) {
          itemObj.price = parseFloat(itemObj.price.toString()); // Convert Decimal128 to a number
        }
        return itemObj;
      }),
    };

    // Respond with the updated cart data
    res.status(200).json(cartWithPriceAsNumber);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Error fetching cart", error });
  }
};
