const express = require("express");
const {
  verifyPayment,
  initializePayment,
} = require("../controllers/payment.controller");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Verify Payment Route
router.post("/verify-payment", protect("customer"), verifyPayment);
router.post("/initialize-payment", protect("customer"), initializePayment);

module.exports = router;
