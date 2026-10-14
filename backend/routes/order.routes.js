const express = require("express");
const protect = require("../middlewares/auth.middleware");
const {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/order.controller");

const router = express.Router();

// Every order route needs a logged-in customer
router.use(protect);

router.post("/create-payment-order", createPaymentOrder);
router.post("/", createPaymentOrder); // same thing; the lab's Postman test 1 uses POST /orders
router.post("/verify-payment", verifyPayment);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus); // bonus: development-only status changes

module.exports = router;
