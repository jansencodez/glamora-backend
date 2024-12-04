import express from "express";
import dotenv from "dotenv"; // Correct import for dotenv
import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./config/database.js"; // Add .js extension for local files
import productRoutes from "./routes/products.js"; // Add .js extension
import cartRoutes from "./routes/cartRoutes.js"; // Add .js extension
import orderRoutes from "./routes/orderRoutes.js"; // Add .js extension
import authRoutes from "./routes/authRoutes.js"; // Add .js extension
import adminRoutes from "./routes/adminRoutes.js"; // Add .js extension
import usersRoutes from "./routes/usersRoutes.js"; // Add .js extension
import chatRoutes from "./routes/chatbotRoutes.js"; // Add .js extension
import paymentRoutes from "./routes/paymentRoutes.js"; // Add .js extension
import analyticsRoutes from "./routes/analyticsRoutes.js"; // Add .js extension
import reviewRoutes from "./routes/reviewsRoutes.js"; // Add .js extension

// Initialize dotenv
dotenv.config();

// Connect to the database
connectDB();

const app = express();

// Enable CORS
app.use(cors());

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Routes
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
