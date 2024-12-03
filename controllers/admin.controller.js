const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Admin Sign-Up
exports.adminSignup = async (req, res) => {
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
exports.adminSignin = async (req, res) => {
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
// Mock Admin data (replace with real database queries if needed)
const mockAdminData = {
  totalUsers: 120,
  totalOrders: 350,
  totalProducts: 75,
  totalRevenue: 5000,
};

// Controller function to send admin data
exports.getAdminData = (req, res) => {
  try {
    // You can use the req.user object to access the decoded token (e.g., user role)
    return res.status(200).json(mockAdminData); // Send the admin data
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
