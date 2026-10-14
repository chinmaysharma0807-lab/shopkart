const bcrypt = require("bcrypt");
const Customer = require("../models/customer.model");
const generateToken = require("../utils/generateToken");

const SALT_ROUNDS = 10;

// Shape of a customer that is safe to send to the client (no password).
const toPublicCustomer = (customer) => ({
  _id: customer._id,
  fullName: customer.fullName,
  email: customer.email,
  phone: customer.phone,
});

// POST /customers/register
const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body || {};

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 6 characters" });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const customer = await Customer.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
    });

    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: toPublicCustomer(customer),
    });
  } catch (error) {
    // Race condition: two requests with the same email at the same time
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /customers/login
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // password has select:false in the schema, so ask for it explicitly
    const customer = await Customer.findOne({ email: email.toLowerCase() }).select("+password");

    // Same message for "no such email" and "wrong password"
    if (!customer || !(await bcrypt.compare(password, customer.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    generateToken(res, customer._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      customer: toPublicCustomer(customer),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /customers/me  (protected)
const getMyProfile = async (req, res) => {
  // req.user was attached by the auth middleware
  return res.status(200).json(toPublicCustomer(req.user));
};

// POST /customers/logout  (protected)
const logoutCustomer = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

// PATCH /customers/change-password  (protected, bonus)
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Old password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "New password must be at least 6 characters" });
    }

    const customer = await Customer.findById(req.user._id).select("+password");

    const isMatch = await bcrypt.compare(oldPassword, customer.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Old password is incorrect" });
    }

    customer.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await customer.save();

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getMyProfile,
  logoutCustomer,
  changePassword,
};
