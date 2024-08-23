const User = require("../models/user");
const Transactions = require("../models/transaction");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // Assuming bcrypt for password hashing

// Admin login controller
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if admin exists
    const user = await User.findOne({ email, role: "admin" });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h", // Token expires in 24 hours
      }
    );

    // Set token in cookies
    res.cookie("betAppUserToken", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production", // Cookie is only sent over HTTPS in production
      sameSite: "None",
    });

    res.json({ message: "Login successful." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

//check admin
exports.checkAdmin = async (req, res) => {
  try {
    const { user } = req;

    await User.findById(user.id); // Assuming req.user is populated by your auth middleware
    if (user && user.role === "admin") {
      return res.json({ isAdmin: true });
    }
    res.json({ isAdmin: false });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

//fetch all users
exports.getUsersInChunks = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const users = await User.find()
      .sort({ createdAt: -1 }) // Sort by creation date in descending order (most recent first)
      .skip((page - 1) * limit) // Skip the documents that come before the current page
      .limit(Number(limit)); // Limit the number of documents returned

    const totalUsers = await User.countDocuments();
    res.status(200).json({
      totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      users,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all deposit requests and populate user
exports.getAllDepositRequests = async (req, res) => {
  try {
    const deposits = await Transactions.find({
      type: "manual",
      status: "In Process",
      transactionType: "Deposit",
    })
      .populate("user") // Adjust fields as needed
      .sort({ createdAt: -1 }); // Sorting by most recent

    res.status(200).json(deposits);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transactions.find()
      .populate("user", "-password") // Populate user data excluding the password
      .sort({ createdAt: -1 }); // Sort by most recent

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};
