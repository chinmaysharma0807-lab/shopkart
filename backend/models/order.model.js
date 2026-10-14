const mongoose = require("mongoose");

// Unlike the cart, an order is a historical record. Each item stores a
// *snapshot* of the product's name, price and image at purchase time, so the
// order still shows what was actually paid even if the product changes later.
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // price per unit at purchase time
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Our "User" model is called Customer in this project
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: [(items) => items.length > 0, "An order needs at least one item"],
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    // Calculated on the server from the latest product prices, never sent by the client
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },
    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"],
      default: "PENDING_PAYMENT",
    },
    // Payment identifiers only. Card details never touch our server.
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true } // createdAt = when the order was placed
);

module.exports = mongoose.model("Order", orderSchema);
