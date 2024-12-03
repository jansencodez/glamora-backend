const express = require("express");
const router = express.Router();
const ReviewController = require("../controllers/reviews.controller");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect("customer"), ReviewController.addReview);
router.get("/:productId", ReviewController.getReviews);
router.delete("/:reviewId", protect("customer"), ReviewController.deleteReview);

module.exports = router;
