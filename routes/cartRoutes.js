const express = require("express");
const cartController = require("../controllers/cart.controller");
const { protect } = require("../middleware/authMiddleware");
const { ensureCartExists } = require("../middleware/createCart");

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

module.exports = router;
