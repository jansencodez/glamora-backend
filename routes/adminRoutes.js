const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { protect } = require("../middleware/authMiddleware");

// Admin Routes
router.post("/signup", adminController.adminSignup); // Admin sign-up
router.post("/signin", adminController.adminSignin); // Admin sign-in
router.get("/data", protect("admin"), adminController.getAdminData);

module.exports = router;
