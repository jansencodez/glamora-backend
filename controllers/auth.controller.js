// controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { Cart } = require("../models/Order");

exports.signup = async (req, res) => {
  const { name, email, password, confirmPassword, optIn } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate email format (basic regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // Check password strength
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long." });
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with a role of "customer"
    const user = new User({
      name,
      email,
      password: hashedPassword,
      optIn: optIn || false,
      role: "customer", // Set role explicitly as "customer"
    });

    await user.save();

    const cart = new Cart({ user: user._id, items: [] });
    await cart.save();
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role }, // Include role in the token
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(201).json({
      message: "User created successfully.",
      token,
      user,
      role: user.role, // Return role to the client if needed
    });
  } catch (error) {
    console.error("Error during sign-up:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate required fields
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Compare the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Sign-in successful.",
      token,
      user,
      role: user.role, // Return role to the client if needed
    });
  } catch (error) {
    console.error("Error during sign-in:", error);
    return res.status(500).json({ message: "Server error." });
  }
};
