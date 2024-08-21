// middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/user"); // Ensure the correct path to your User model

const authMiddleware = {
  verifyToken: async (req, res, next) => {
    const token = req.cookies.betAppUserToken;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      // Fetch user details from the database
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      req.user = user; // Attach user details to the req object
      next();
    } catch (error) {
      res.status(400).json({ message: "Invalid token." });
    }
  },

  authorizeRole: (role) => {
    return (req, res, next) => {
      if (req.user.role !== role) {
        return res.status(403).json({ message: "Access denied." });
      }
      next();
    };
  },
};

module.exports = authMiddleware;
