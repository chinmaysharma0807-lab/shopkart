const Razorpay = require("razorpay");

// Use TEST MODE keys only (they start with rzp_test_). The key secret is
// read from .env on the server and is never sent to the frontend.
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

const isRazorpayConfigured = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);

// The Razorpay constructor throws if the keys are missing, so only create
// the client when they're set. Checkout returns a clear error otherwise.
const razorpay = isRazorpayConfigured
  ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
  : null;

if (!isRazorpayConfigured) {
  console.warn("Razorpay keys missing: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
}

module.exports = { razorpay, isRazorpayConfigured };
