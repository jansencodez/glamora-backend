import Product from "../models/Product.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import mongoose from "mongoose";
import handleError from "../utils/handleError.js";

// Get all products with pagination and price conversion
export const getAllProducts = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const products = await Product.find()
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Convert price from Decimal128 to regular number
    const productsWithPriceAsNumber = products.map((product) => ({
      ...product.toObject(), // Convert mongoose document to plain JS object
      price: parseFloat(product.price.toString()), // Convert price from Decimal128 to float
    }));

    const total = await Product.countDocuments();

    // Send response with products and pagination data
    res.status(200).json({
      success: true,
      products: productsWithPriceAsNumber,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    handleError(res, error, "Error fetching products");
  }
};

// Get a single product by ID
export const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    // Convert price from Decimal128 to regular number
    const productWithPrice = {
      ...product.toObject(),
      price: parseFloat(product.price.toString()),
    };
    res.status(200).json({ success: true, product: productWithPrice });
  } catch (error) {
    handleError(res, error, "Error fetching product");
  }
};

// Create a new product
export const createProduct = async (req, res) => {
  const { name, price, description, category, rating } = req.body;

  // Validate required fields
  if (!name || !price || !description || !category || rating === undefined) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  // Parse price and rating to ensure they are correct types
  const parsedPrice = parseFloat(price);
  const parsedRating = parseInt(rating, 10);

  if (isNaN(parsedPrice) || isNaN(parsedRating)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid price or rating value" });
  }

  // Check if files were uploaded and are valid image formats
  if (!req.files || req.files.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No images uploaded" });
  }

  try {
    // Handle image upload to Cloudinary
    const folder = `glamora_products/${category || "uncategorized"}`;
    const imageUploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, folder)
    );

    const uploadedImages = await Promise.all(imageUploadPromises);
    const imageUrls = uploadedImages.map((result) => result.secure_url);

    // Create the product with image URLs and other details
    const newProduct = new Product({
      name,
      price: new mongoose.Types.Decimal128(parsedPrice.toString()), // Save as Decimal128 for price
      description,
      category,
      discount: 0,
      rating: parsedRating,
      imageUrls, // Store the Cloudinary image URLs
    });

    // Save product to the database
    await newProduct.save();
    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

export const bulkUploadProducts = async (req, res) => {
  try {
    // Parse the products JSON string and retrieve uploaded images
    const products = JSON.parse(req.body.products);
    const images = req.files;

    if (!products || products.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No products provided" });
    }

    if (!images || images.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No images provided" });
    }

    const uploadedProducts = [];

    for (const product of products) {
      const category = product.category || "uncategorized";
      const folder = `glamora_products/${category}`;

      // Map through images and upload them to Cloudinary
      const imageUploadPromises = images.map((file) =>
        uploadToCloudinary(file.buffer, folder)
      );

      try {
        // Wait for all image uploads to complete
        const uploadedImages = await Promise.all(imageUploadPromises);
        const imageUrls = uploadedImages.map((result) => result.secure_url);

        // Create a new product with the uploaded images
        const newProduct = new Product({
          name: product.name,
          price: product.price,
          description: product.description,
          category: product.category,
          rating: product.rating,
          imageUrls: imageUrls,
        });

        // Save the product in the database
        await newProduct.save();
        uploadedProducts.push(newProduct);
        res.json({ success: true, products: uploadedProducts });
      } catch (imageError) {
        console.error("Error uploading images", imageError);
        return res
          .status(500)
          .json({ success: false, message: "Error uploading images" });
      }
    }

    // Respond with the uploaded products
    res.status(201).json({
      success: true,
      message: `${uploadedProducts.length} products uploaded successfully`,
      products: uploadedProducts,
    });
  } catch (error) {
    console.error("Error in bulk upload products", error);
    res
      .status(500)
      .json({ success: false, message: "Error uploading products" });
  }
};

// Update an existing product
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true, // Return the updated document
    });

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

// Delete a product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const imageDeletionPromises = product.imageUrls.map((url) =>
      uploader.destroy(url.split("/").pop().split(".")[0])
    );
    await Promise.all(imageDeletionPromises);

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    handleError(res, error, "Error deleting product");
  }
};
