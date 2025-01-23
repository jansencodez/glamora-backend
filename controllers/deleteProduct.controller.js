import cloudinary from "../config/cloudinaryConfig.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

// Delete Product Controller
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Find the product by ID
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete images from Cloudinary
    const deleteImagesPromises = product.imageUrls.map((url) => {
      const publicId = url.split("/").pop().split(".")[0]; // Extract public ID from the URL
      return cloudinary.uploader.destroy(`products/${publicId}`);
    });

    await Promise.all(deleteImagesPromises);

    // Delete the product from the database
    await Product.findByIdAndDelete(id);

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error while deleting product:", error);
    return res
      .status(500)
      .json({ error: "Failed to delete product", details: error.message });
  }
};
