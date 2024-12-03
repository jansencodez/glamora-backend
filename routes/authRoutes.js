// routes/authRoutes.js
const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

// Sign-up route
router.post("/signup", authController.signup);

// Sign-in route
router.post("/signin", authController.signin);

module.exports = router;
