import User from "../models/User.js"; // Assuming User model is in this path

// Controller to get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate("orders"); // Populate order details (if necessary)
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve users." });
  }
};

// Controller to get a single user by ID
export const getUserById = async (req, res) => {
  const { userId } = req.user;
  try {
    const user = await User.findById(userId).populate("orders"); // Populate order details
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({ user, orders: user.orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to retrieve the user." });
  }
};
