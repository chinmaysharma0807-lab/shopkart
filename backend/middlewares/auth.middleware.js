const jwt = require("jsonwebtoken");
const Customer = require("../models/customer.model");

const protect = async (req, res, next) => {
  try {
    // The browser sends the token in the HttpOnly cookie. Tools like Postman
    // may send it as "Authorization: Bearer <token>" instead.
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const token = req.cookies.token || bearerToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const customer = await Customer.findById(decoded.id);
    if (!customer) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    req.user = customer;
    next();
  } catch (error) {
    // jwt.verify throws for expired, malformed, or tampered tokens
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = protect;
