const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // never returned by queries unless explicitly asked for
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    // References to Product documents, not copies of them. The products
    // collection stays the single source of truth for price, stock, etc.
    wishlist: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
      default: [],
    },
    // Each cart row is a Product reference plus how many units the customer
    // wants. Price, name, stock etc. always come from the Product itself.
    cart: {
      type: [
        {
          _id: false, // rows are identified by their product, no extra ID needed
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          },
          quantity: {
            type: Number,
            default: 1,
            min: [1, "Quantity must be at least 1"],
          },
        },
      ],
      default: [],
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model("Customer", customerSchema);
