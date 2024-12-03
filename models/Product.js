const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: mongoose.Schema.Types.Decimal128, required: true },
    imageUrls: [{ type: String, required: true }], // Array of image URLs
    category: { type: String, required: true },
    rating: { type: Number, default: 0 },
    discount: { type: Number, default: 0, required: false }, // Optional discount field
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
