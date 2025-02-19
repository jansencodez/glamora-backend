import express from "express";
import * as cartController from "../controllers/cart.controller.js";
import { protect } from "../middleware/authMiddleware.js";
import { ensureCartExists } from "../middleware/createCart.js";

const router = express.Router();

// Add item to cart (ensure cart exists first)
router.post(
  "/",
  protect("customer"), // Ensure the user is authenticated as a "customer"
  ensureCartExists, // Ensure a cart exists for the user
  cartController.addToCart // Add item to cart
);

// Update cart item (ensure user is authenticated)
router.put(
  "/",
  protect("customer"), // Ensure the user is authenticated as a "customer"
  cartController.updateCartItem // Update item in cart
);

// Remove item from cart (ensure user is authenticated)
router.delete(
  "/:id",
  protect("customer"), // Ensure the user is authenticated as a "customer"
  cartController.removeFromCart // Remove item from cart
);

// Get all items in the cart (ensure cart exists first)
router.get(
  "/",
  protect("customer"), // Ensure the user is authenticated as a "customer"
  ensureCartExists, // Ensure a cart exists for the user
  cartController.getCart // Get all items in the cart
);

export default router; // Use export default instead of module.exports
