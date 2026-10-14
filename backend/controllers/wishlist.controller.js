const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// Fields the wishlist cards need from each product
const WISHLIST_FIELDS = "name price category image stock";

// req.user is the logged-in customer, attached by the auth middleware.
// The user ID always comes from the JWT, never from the request.
const isInWishlist = (customer, productId) =>
  customer.wishlist.some((id) => id.equals(productId));

// POST /wishlist/:productId
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (isInWishlist(req.user, productId)) {
      return res.status(409).json({ success: false, message: "Product already in wishlist" });
    }

    // $addToSet only adds the ID if it isn't already in the array, so even two
    // requests arriving at the same moment can't create a duplicate.
    await Customer.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: productId } });

    return res.status(200).json({ success: true, message: "Product added to wishlist" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /wishlist
const getWishlist = async (req, res) => {
  try {
    // populate() swaps each ObjectId in `wishlist` for the actual Product
    // document (only the fields we ask for). Products that were deleted
    // come back as null and Mongoose leaves them out.
    const customer = await Customer.findById(req.user._id).populate({
      path: "wishlist",
      select: WISHLIST_FIELDS,
    });

    return res.status(200).json({
      success: true,
      count: customer.wishlist.length,
      wishlist: customer.wishlist,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /wishlist/:productId
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    if (!isInWishlist(req.user, productId)) {
      return res.status(404).json({ success: false, message: "Product not in wishlist" });
    }

    // $pull removes every matching ID from the array
    await Customer.updateOne({ _id: req.user._id }, { $pull: { wishlist: productId } });

    return res.status(200).json({ success: true, message: "Product removed from wishlist" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /wishlist/:productId/toggle  (bonus)
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    if (isInWishlist(req.user, productId)) {
      await Customer.updateOne({ _id: req.user._id }, { $pull: { wishlist: productId } });
      return res
        .status(200)
        .json({ success: true, saved: false, message: "Product removed from wishlist" });
    }

    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await Customer.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: productId } });
    return res
      .status(200)
      .json({ success: true, saved: true, message: "Product added to wishlist" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { addToWishlist, getWishlist, removeFromWishlist, toggleWishlist };
