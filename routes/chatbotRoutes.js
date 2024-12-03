const express = require("express");
const router = express.Router();
const ChatbotController = require("../controllers/chatbot.controller");

router.post("/", ChatbotController.chatBot);

module.exports = router;
