import express from "express";
import * as productsController from "../controllers/products.controller.js";
import { protect } from "../middleware/authMiddleware.js";
import multer from "multer";
import * as singleUpload from "../controllers/singleUpload.controller.js";

// Set up multer storage for Cloudinary (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// Route to get all products
router.get("/", productsController.getAllProducts);

// Route to get a product by ID
router.get("/:id", productsController.getProductById);

// Route to update a product
router.put("/:id", productsController.updateProduct);

// Route to delete a product
router.delete("/:id", productsController.deleteProduct);

// Route for product upload
router.post(
  "/",
  protect("admin"),
  upload.array("images", 5), // Limit to 5 files
  singleUpload.uploadProduct // Ensure this matches your controller export
);

export default router;
