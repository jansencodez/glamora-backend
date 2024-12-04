import { Cart } from "../models/Order.js";

export const ensureCartExists = async (req, res, next) => {
  try {
    const { userId } = req.user;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }

    req.cart = cart; // Attach the cart to the request object for further use
    next();
  } catch (error) {
    res.status(500).json({ message: "Error ensuring cart exists", error });
  }
};
