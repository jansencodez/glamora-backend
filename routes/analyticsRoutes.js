const express = require("express");
const { getAnalytics } = require("../controllers/analytics.controller");

const router = express.Router();

// Define the analytics route
router.get("/", getAnalytics);

module.exports = router;
