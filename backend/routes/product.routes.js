const express = require("express");
const {
  createProduct,
  getProducts,
  getProductById,
} = require("../controllers/product.controller");

const router = express.Router();

// Open for now; admin-only protection comes in a later lab
router.post("/", createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);

module.exports = router;
