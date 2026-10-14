const crypto = require("crypto");
const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const { razorpay, isRazorpayConfigured } = require("../config/razorpay");

const ADDRESS_FIELDS = ["fullName", "phone", "addressLine1", "city", "state", "pincode"];

const ADDRESS_LABELS = {
  fullName: "Full name",
  phone: "Phone number",
  addressLine1: "Address",
  city: "City",
  state: "State",
  pincode: "Pincode",
};

// Trims every field and checks the rules. Returns { address, errors }.
const validateShippingAddress = (input) => {
  const address = {};
  const errors = {};

  for (const field of ADDRESS_FIELDS) {
    const value = typeof input?.[field] === "string" ? input[field].trim() : "";
    address[field] = value;
    // "   " counts as empty because we trimmed it
    if (!value) errors[field] = `${ADDRESS_LABELS[field]} is required`;
  }

  if (address.phone && !/^[6-9]\d{9}$/.test(address.phone)) {
    errors.phone = "Phone must be a valid 10-digit mobile number";
  }
  if (address.pincode && !/^[1-9]\d{5}$/.test(address.pincode)) {
    errors.pincode = "Pincode must contain 6 digits";
  }

  return { address, errors };
};

// POST /orders/create-payment-order   body: { shippingAddress }
// Anything else in the body (totalAmount, items, prices...) is ignored.
const createPaymentOrder = async (req, res) => {
  try {
    // 1. Shipping address
    const { address, errors } = validateShippingAddress(req.body?.shippingAddress);
    if (Object.keys(errors).length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Please fix the shipping details", errors });
    }

    // 2. The logged-in customer's cart (req.user comes from the JWT)
    const cart = req.user.cart;
    if (cart.length === 0) {
      return res.status(400).json({ success: false, message: "Your cart is empty" });
    }

    // 3. Load the LATEST product data. The cart could be days old.
    const products = await Product.find({ _id: { $in: cart.map((item) => item.product) } });
    const productsById = new Map(products.map((p) => [p._id.toString(), p]));

    // 4. Check every item again and build the purchase-time snapshot
    const items = [];
    for (const cartItem of cart) {
      const product = productsById.get(cartItem.product.toString());

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart is no longer available. Please remove it and try again.",
        });
      }

      if (cartItem.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message:
            product.stock === 0
              ? `${product.name} is out of stock.`
              : `Insufficient stock for ${product.name}. Only ${product.stock} left.`,
        });
      }

      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image,
      });
    }

    // 5. The server calculates the total. A totalAmount from the client is never read.
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (!isRazorpayConfigured) {
      return res.status(503).json({
        success: false,
        message: "Payments are not set up on the server yet. Add the Razorpay test keys to .env.",
      });
    }

    // 6. Save our own order first, waiting for payment. The cart is NOT touched.
    const order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress: address,
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    // 7. Create the matching Razorpay order. Razorpay wants the amount in
    //    paise (the smallest unit of INR): Rs 499 -> 49900.
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: order._id.toString(),
        notes: { shopKartOrderId: order._id.toString() },
      });
    } catch (error) {
      order.paymentStatus = "FAILED";
      await order.save();
      console.error("Razorpay order creation failed:", error?.error?.description || error.message);
      return res
        .status(502)
        .json({ success: false, message: "Could not start the payment. Please try again." });
    }

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    // 8. Only safe values go back: the key ID is public, the key secret is not.
    return res.status(201).json({
      success: true,
      shopKartOrderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Compares two hex strings in constant time (avoids leaking timing info)
const signaturesMatch = (expected, received) => {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(received), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// POST /orders/verify-payment
// body: { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
const verifyPayment = async (req, res) => {
  try {
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body || {};

    if (!shopKartOrderId || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment details" });
    }
    if (!mongoose.isValidObjectId(shopKartOrderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    if (!isRazorpayConfigured) {
      return res.status(503).json({ success: false, message: "Payments are not set up" });
    }

    // Only the logged-in customer's own order
    const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Already confirmed (e.g. the request was sent twice): just return it
    if (order.paymentStatus === "PAID") {
      return res.status(200).json({ success: true, message: "Payment already verified", order });
    }

    // The Razorpay order ID we saved is the trusted one, not the browser's copy
    if (!order.razorpayOrderId || razorpay_order_id !== order.razorpayOrderId) {
      return res
        .status(400)
        .json({ success: false, message: "Payment does not belong to this order" });
    }

    // Razorpay signs "<order_id>|<payment_id>" with our key secret (HMAC-SHA256).
    // Only Razorpay and our server know the secret, so a matching signature
    // proves the payment really happened for this order.
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
      .digest("hex");

    if (!signaturesMatch(expectedSignature, razorpay_signature)) {
      // Order stays PENDING and the cart is left alone
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // Signature is valid: mark the order paid. The paymentStatus filter makes
    // this happen only once even if two verify requests arrive together.
    const paidOrder = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: { $ne: "PAID" } },
      {
        $set: {
          paymentStatus: "PAID",
          status: "PLACED",
          razorpayPaymentId: razorpay_payment_id,
          paidAt: new Date(),
        },
      },
      { new: true }
    );

    if (!paidOrder) {
      const existing = await Order.findById(order._id);
      return res
        .status(200)
        .json({ success: true, message: "Payment already verified", order: existing });
    }

    // Reduce stock for what was bought. The $gte filter stops stock going
    // negative; a real shop would flag and refund that rare case.
    await Product.bulkWrite(
      paidOrder.items.map((item) => ({
        updateOne: {
          filter: { _id: item.product, stock: { $gte: item.quantity } },
          update: { $inc: { stock: -item.quantity } },
        },
      }))
    );

    // Only now, after a verified payment, empty the cart
    await Customer.updateOne({ _id: req.user._id }, { $set: { cart: [] } });

    return res.status(200).json({ success: true, message: "Payment verified", order: paidOrder });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /orders  -> the logged-in customer's order history, newest first.
// Unpaid checkout attempts aren't real orders, so only PAID ones are listed.
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id, paymentStatus: "PAID" }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /orders/:id
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    // Filtering by user too means someone else's order is simply "not found".
    // We don't reveal that it exists.
    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /orders/:id/status   body: { status }   (bonus, development only)
// Stands in for an admin panel so status progression can be demonstrated.
const STATUS_FLOW = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

const updateOrderStatus = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    if (!STATUS_FLOW.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: `Status must be one of: ${STATUS_FLOW.join(", ")}` });
    }

    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.paymentStatus !== "PAID") {
      return res.status(400).json({ success: false, message: "Order has not been paid" });
    }

    // Status can only move forward: PLACED -> CONFIRMED -> SHIPPED -> DELIVERED
    if (STATUS_FLOW.indexOf(status) <= STATUS_FLOW.indexOf(order.status)) {
      return res
        .status(400)
        .json({ success: false, message: `Order is already ${order.status}` });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({ success: true, message: "Order status updated", order });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
};
