const Review = require("../models/Review");
const mongoose = require("mongoose");

exports.getReviews = async (req, res) => {
  const { productId } = req.params;
  console.log(productId);

  // Validate productId
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ error: "Invalid or missing productId." });
  }

  try {
    // Fetch reviews for the product
    const reviews = await Review.find({ productId }).populate("userId", "name"); // Populate user name

    // Calculate average rating
    const averageRating = await Review.aggregate([
      { $match: { productId: mongoose.Types.ObjectId } }, // `new` added here
      { $group: { _id: null, average: { $avg: "$rating" } } },
    ]);

    // Respond with reviews and average rating
    res.json({
      reviews,
      averageRating: averageRating.length ? averageRating[0].average : 0,
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Error fetching reviews." });
  }
};

exports.addReview = async (req, res) => {
  const { productId, rating, text } = req.body;
  const { userId } = req.user; // Assuming you're using authentication

  try {
    const newReview = new Review({
      productId,
      userId,
      rating,
      text,
    });

    await newReview.save();
    res.status(201).json({ message: "Review submitted!" });
  } catch (err) {
    res.status(500).json({ error: "Error submitting review." });
  }
};

exports.deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  try {
    const deletedReview = await Review.findByIdAndDelete(reviewId);
    if (!deletedReview) {
      return res.status(404).json({ error: "Review not found." });
    }
    res.json({ message: "Review deleted successfully." });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ error: "Error deleting review." });
  }
};

exports.updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { rating, text } = req.body;

  try {
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { rating, text },
      { new: true }
    );
    if (!updatedReview) {
      return res.status(404).json({ error: "Review not found." });
    }
    res.json(updatedReview);
  } catch (err) {
    console.error("Error updating review:", err);
    res.status(500).json({ error: "Error updating review." });
  }
};
