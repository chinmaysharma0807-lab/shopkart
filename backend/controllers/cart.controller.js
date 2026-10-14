const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// Fields the cart UI needs from each product
const CART_PRODUCT_FIELDS = "name price category image stock";

// req.user is the logged-in customer, attached by the auth middleware.
// The user ID always comes from the JWT, never from the request.
const findCartItem = (customer, productId) =>
  customer.cart.find((item) => item.product.equals(productId));

// Loads the customer's cart with each product's latest details.
// Products that were deleted come back as null, so they're left out.
const getPopulatedCart = async (customerId) => {
  const customer = await Customer.findById(customerId).populate({
    path: "cart.product",
    select: CART_PRODUCT_FIELDS,
  });

  return customer.cart
    .filter((item) => item.product !== null)
    .map((item) => ({ product: item.product, quantity: item.quantity }));
};

const stockMessage = (stock) =>
  stock === 0 ? "This product is out of stock" : `Only ${stock} in stock`;

// POST /cart/:productId  -> add 1 unit (new row, or +1 on the existing row)
const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(productId).select("stock");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const existing = findCartItem(req.user, productId);
    const newQuantity = existing ? existing.quantity + 1 : 1;

    // Always check against the product's *current* stock
    if (newQuantity > product.stock) {
      return res.status(400).json({ success: false, message: stockMessage(product.stock) });
    }

    if (existing) {
      // "cart.$" means "the cart row that matched the filter"
      await Customer.updateOne(
        { _id: req.user._id, "cart.product": productId },
        { $set: { "cart.$.quantity": newQuantity } }
      );
    } else {
      // The $ne filter makes sure we never push a second row for the same product
      await Customer.updateOne(
        { _id: req.user._id, "cart.product": { $ne: productId } },
        { $push: { cart: { product: productId, quantity: 1 } } }
      );
    }

    const cart = await getPopulatedCart(req.user._id);
    return res.status(200).json({ success: true, message: "Cart updated", cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /cart
const getCart = async (req, res) => {
  try {
    const cart = await getPopulatedCart(req.user._id);
    return res.status(200).json({ success: true, cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /cart/:productId   body: { "quantity": 3 }
const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body || {};

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    if (typeof quantity !== "number" || !Number.isInteger(quantity)) {
      return res.status(400).json({ success: false, message: "Quantity must be a whole number" });
    }

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId).select("stock");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (!findCartItem(req.user, productId)) {
      return res.status(404).json({ success: false, message: "Product not in cart" });
    }

    if (quantity > product.stock) {
      return res.status(400).json({ success: false, message: stockMessage(product.stock) });
    }

    await Customer.updateOne(
      { _id: req.user._id, "cart.product": productId },
      { $set: { "cart.$.quantity": quantity } }
    );

    const cart = await getPopulatedCart(req.user._id);
    return res.status(200).json({ success: true, message: "Cart updated", cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /cart/:productId
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    if (!findCartItem(req.user, productId)) {
      return res.status(404).json({ success: false, message: "Product not in cart" });
    }

    await Customer.updateOne({ _id: req.user._id }, { $pull: { cart: { product: productId } } });

    const cart = await getPopulatedCart(req.user._id);
    return res.status(200).json({ success: true, message: "Product removed from cart", cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { addToCart, getCart, updateCartQuantity, removeFromCart };
