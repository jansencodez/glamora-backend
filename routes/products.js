import express from "express";
import upload from "../utils/upload.js"; // Add .js extension
import * as productsController from "../controllers/products.controller.js"; // Add .js extension

const router = express.Router();

// Route to get all products
router.get("/", productsController.getAllProducts);

// Route to get a product by ID
router.get("/:id", productsController.getProductById);

// Route to create a new product
router.post("/", upload, productsController.createProduct);

// Route to update a product
router.put("/:id", productsController.updateProduct);

// Route to delete a product
router.delete("/:id", productsController.deleteProduct);

// Route for bulk product upload
router.post("/bulk", upload, productsController.bulkUploadProducts);

export default router; // Use export instead of module.exports
