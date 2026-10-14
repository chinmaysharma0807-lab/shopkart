const mongoose = require("mongoose");
const Product = require("../models/product.model");

// Fields the product listing UI actually needs (no description, no timestamps)
const LIST_FIELDS = "name price category image stock";

const SORT_OPTIONS = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { createdAt: -1 },
};

// Escape characters like . * ( ) so user input is searched literally,
// not interpreted as a regular expression.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// POST /products
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body || {};

    const product = await Product.create({ name, description, price, category, image, stock });

    return res.status(201).json({ success: true, product });
  } catch (error) {
    // Missing field, price <= 0, negative stock, or a non-number price/stock
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((err) => (err.name === "CastError" ? `${err.path} must be a number` : err.message))
        .join(", ");
      return res.status(400).json({ success: false, message });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /products?search=...&category=...&sort=...
const getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    // Build the MongoDB filter only from the query params that were sent
    const filter = {};

    if (search && search.trim()) {
      filter.name = { $regex: escapeRegex(search.trim()), $options: "i" }; // case-insensitive
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    const sortBy = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;

    const products = await Product.find(filter).select(LIST_FIELDS).sort(sortBy);

    return res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /products/:id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createProduct, getProducts, getProductById };
