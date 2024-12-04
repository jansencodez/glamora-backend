import mongoose from "mongoose";
import { Cart } from "../models/Order.js";

// Create Cart
export const createCart = async (req, res) => {
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
export const addToCart = async (req, res) => {
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
export const updateCartItem = async (req, res) => {
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
        ...cart.toObject(),
        items: cart.items.map((item) => {
          const itemObj = { ...item._doc };
          if (itemObj.price instanceof mongoose.Types.Decimal128) {
            itemObj.price = parseFloat(itemObj.price.toString());
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
export const removeFromCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const originalCartLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== id.toString()
    );

    if (cart.items.length === originalCartLength) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    if (cart.items.length === 0) {
      cart.status = "empty";
    }

    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ message: "Error removing item from cart", error });
  }
};

// Get All Items in Cart
export const getCart = async (req, res) => {
  try {
    const { userId } = req.user;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const cartWithPriceAsNumber = {
      ...cart.toObject(),
      items: cart.items.map((item) => {
        const itemObj = { ...item._doc };
        if (itemObj.price instanceof mongoose.Types.Decimal128) {
          itemObj.price = parseFloat(itemObj.price.toString());
        }
        return itemObj;
      }),
    };

    res.status(200).json(cartWithPriceAsNumber);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Error fetching cart", error });
  }
};
