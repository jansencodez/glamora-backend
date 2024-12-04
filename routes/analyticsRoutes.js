import express from "express";
import { getAnalytics } from "../controllers/analytics.controller.js";

const router = express.Router();

// Define the analytics route
router.get("/", getAnalytics);

export default router; // Use export default instead of module.exports
