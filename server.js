const express = require("express");
require("dotenv").config(); // Fix: Correct import for dotenv
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/database");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const usersRoutes = require("./routes/usersRoutes");
const chatRoutes = require("./routes/chatbotRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const reviewRoutes = require("./routes/reviewsRoutes");

// Connect to the database
connectDB();

const app = express();

// Enable CORS
app.use(cors());

// Middleware to parse JSON requests
app.use(bodyParser.json());

// routes
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reviews", reviewRoutes);

const PORT = process.env.PORT || 5000; // Default to 5000 if PORT is not defined in .env

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
