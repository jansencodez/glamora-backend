import express from "express";
import { getAllUsers, getUserById } from "../controllers/users.controller.js"; // Add .js extension
import { protect } from "../middleware/authMiddleware.js"; // Add .js extension

const router = express.Router();

// Route to get all users
router.get("/", getAllUsers);

// Route to get a user by ID
router.get("/profile", protect("customer"), getUserById);

export default router; // Use export instead of module.exports
