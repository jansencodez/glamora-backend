import mongoose from "mongoose";

// Define the CartItem schema (includes reference to the Product)
const CartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: { type: Number, required: true },
  name: { type: String, required: true },
  price: { type: mongoose.Schema.Types.Decimal128, required: true },
  imageUrls: [{ type: String, required: true }],
});

// Define the ShippingDetails schema
const ShippingDetailsSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  deliveryDate: { type: Date, required: true },
});

// Define the PaymentDetails schema
const PaymentDetailsSchema = new mongoose.Schema({
  method: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "canceled"],
    required: true,
  },
  transactionId: { type: String, required: false },
});

// Define the OrderDetails schema
const OrderDetailsSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true }, // Unique order ID
    items: [{ type: CartItemSchema, required: true }],
    totalPrice: { type: Number, required: true },
    discountApplied: { type: Number, default: 0 },
    finalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending delivery", "payment pending", "delivered", "canceled"],
      required: true,
    },
    payment: {
      type: PaymentDetailsSchema,
    }, // Reference to PaymentDetails
    shipping: {
      type: ShippingDetailsSchema,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
  },
  { timestamps: true } // Timestamps automatically handle createdAt and updatedAt
);

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [CartItemSchema],
});

// Create the models
const Cart = mongoose.models.Cart || mongoose.model("Cart", CartSchema);
const OrderDetails =
  mongoose.models.OrderDetails ||
  mongoose.model("OrderDetails", OrderDetailsSchema);

// Export the models
export { Cart, OrderDetails };
