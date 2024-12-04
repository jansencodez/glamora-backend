import express from "express";
import * as ReviewController from "../controllers/reviews.controller.js"; // Add .js extension
import { protect } from "../middleware/authMiddleware.js"; // Add .js extension

const router = express.Router();

// Route to add a review
router.post("/", protect("customer"), ReviewController.addReview);

// Route to get reviews for a product
router.get("/:productId", ReviewController.getReviews);

// Route to delete a review
router.delete("/:reviewId", protect("customer"), ReviewController.deleteReview);

export default router; // Use export instead of module.exports
