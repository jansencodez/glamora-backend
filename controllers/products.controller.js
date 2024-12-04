import Product from "../models/Product.js";
import handleError from "../utils/handleError.js";
import cloudinary from "../config/cloudinaryConfig.js";
// Use the uploader
const uploader = cloudinary.uploader;

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
