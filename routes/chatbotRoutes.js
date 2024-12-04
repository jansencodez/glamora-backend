import express from "express";
import * as ChatbotController from "../controllers/chatbot.controller.js";

const router = express.Router();

router.post("/", ChatbotController.chatBot);

export default router; // Use export default instead of module.exports
