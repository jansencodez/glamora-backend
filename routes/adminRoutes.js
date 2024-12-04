import express from "express";
import {
  adminSignup,
  adminSignin,
  getAdminData,
} from "../controllers/admin.controller.js"; // Add .js extension
import { protect } from "../middleware/authMiddleware.js"; // Add .js extension

const router = express.Router();

// Admin Routes
router.post("/signup", adminSignup); // Admin sign-up
router.post("/signin", adminSignin); // Admin sign-in
router.get("/data", protect("admin"), getAdminData); // Admin data access

export default router; // Use export instead of module.exports
