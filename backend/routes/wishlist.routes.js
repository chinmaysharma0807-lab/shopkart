const express = require("express");
const protect = require("../middlewares/auth.middleware");
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
} = require("../controllers/wishlist.controller");

const router = express.Router();

// Every wishlist route needs a logged-in customer.
// There is deliberately no /wishlist/:userId route: the server works out
// whose wishlist it is from the JWT, so nobody can read someone else's.
router.use(protect);

router.get("/", getWishlist);
router.post("/:productId", addToWishlist);
router.delete("/:productId", removeFromWishlist);
router.patch("/:productId/toggle", toggleWishlist);

module.exports = router;
