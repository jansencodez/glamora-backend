import express from "express";
import {
  verifyPayment,
  initializePayment,
} from "../controllers/payment.controller.js"; // Add .js extension
import { protect } from "../middleware/authMiddleware.js"; // Add .js extension

const router = express.Router();

// Verify Payment Route
router.post("/verify-payment", protect("customer"), verifyPayment);
router.post("/initialize-payment", protect("customer"), initializePayment);

export default router; // Use export instead of module.exports
