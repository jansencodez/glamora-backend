const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    optIn: { type: Boolean, default: false },
    role: { type: String, enum: ["customer", "admin"], default: "customer" }, // Default role: customer
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderDetails", // Assuming you have an 'Order' model for order details
      },
    ], // An array of order references
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
