import cloudinary from "../config/cloudinaryConfig.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

export const uploadProduct = async (req, res) => {
  try {
    const { name, price, description, category, rating } = req.body;

    if (!name || !price || !description || !category || !rating) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (isNaN(price)) {
      return res.status(400).json({ error: "Price must be a valid number" });
    }

    console.log("Uploaded files:", req.files);

    const imageUrls = await Promise.all(
      req.files.map(
        (file) =>
          new Promise((resolve, reject) => {
            cloudinary.uploader
              .upload_stream({ folder: "products" }, (error, result) => {
                if (error) {
                  console.error(
                    "Cloudinary upload error:",
                    error,
                    "File:",
                    file
                  );
                  return reject(error);
                }
                resolve(result?.secure_url);
              })
              .end(file.buffer);
          })
      )
    );

    console.log("Image URLs:", imageUrls);

    const parsedPrice = mongoose.Types.Decimal128.fromString(price.toString());

    const newProduct = new Product({
      name,
      price: parsedPrice,
      description,
      category,
      rating,
      imageUrls,
    });

    console.log("Product to save:", newProduct);

    const savedProduct = await newProduct.save();
    return res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Error while uploading product:", error);
    return res
      .status(500)
      .json({ error: "Failed to add product", details: error.message });
  }
};
