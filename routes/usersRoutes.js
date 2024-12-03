const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById } = require("../controllers/users.controller"); // Adjust path as needed
const { protect } = require("../middleware/authMiddleware");

// Route to get all users
router.get("/", getAllUsers);

// Route to get a user by ID
router.get("/profile", protect("customer"), getUserById);

module.exports = router;
