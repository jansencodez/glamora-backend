import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // Note the '.js' extension for ES Modules
import { OrderDetails } from "../models/Order.js";
import Product from "../models/Product.js";

// Admin Sign-Up
export const adminSignup = async (req, res) => {
  const { name, email, password, confirmPassword, optIn } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Check if the admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Admin with this email already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin user with role set to "admin"
    const admin = new User({
      name,
      email,
      password: hashedPassword,
      optIn: optIn || false,
      role: "admin",
    });

    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(201).json({
      message: "Admin created successfully.",
      token,
      user: admin,
      role: admin.role,
    });
  } catch (error) {
    console.error("Error during admin sign-up:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// Admin Sign-In
export const adminSignin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate required fields
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Check if the admin exists
    const admin = await User.findOne({ email, role: "admin" }); // Ensure role is "admin"
    if (!admin) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Admin sign-in successful.",
      token,
      user: admin,
      role: admin.role,
      userId: admin._id,
    });
  } catch (error) {
    console.error("Error during admin sign-in:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export const getAdminData = async (req, res) => {
  try {
    // Get total number of users
    const totalUsers = await User.countDocuments();

    // Get total number of orders
    const totalOrders = await OrderDetails.countDocuments();

    // Get total number of products
    const totalProducts = await Product.countDocuments();

    // Calculate total revenue from orders (assuming the total amount is stored in the `amount` field of the Order model)
    const salesOverview = await OrderDetails.aggregate([
      {
        $match: { status: { $in: ["delivered", "pending delivery"] } }, // Match both delivered and pending delivery orders
      },
      {
        $group: {
          _id: "$status", // Group by status (delivered or pending delivery)
          total: { $sum: { $toDouble: "$finalPrice" } },
        },
      },
    ]);

    const salesData = {
      totalSales: 0,
      pendingDeliverySales: 0,
      deliveredSales: 0,
    };

    // Calculate totals for each status (pending delivery, delivered)
    salesOverview.forEach((item) => {
      if (item._id === "pending delivery") {
        salesData.pendingDeliverySales = item.total;
      } else if (item._id === "delivered") {
        salesData.deliveredSales = item.total;
      }
    });

    salesData.totalSales =
      salesData.pendingDeliverySales + salesData.deliveredSales;

    // Send the actual data as response
    return res.status(200).json({
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue: salesData.totalSales,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
