import express from "express";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

// Sign-up route
router.post("/signup", authController.signup);

// Sign-in route
router.post("/signin", authController.signin);

export default router; // Use export default instead of module.exports
