const User = require("../models/user");
const Transactions = require("../models/transaction");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // Assuming bcrypt for password hashing
const AdminAmount = require("../models/adminAmount");
const Banner = require("../models/banner");
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

// Approve a deposit request
exports.approveDepositRequest = async (req, res) => {
  const { transactionId } = req.params;

  try {
    // Find the transaction and populate the user details
    const transaction = await Transactions.findById(transactionId).populate(
      "user"
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Check if the transaction is in "In Process" state
    if (transaction.status !== "In Process") {
      return res
        .status(400)
        .json({ message: "Transaction is not in 'In Process' state" });
    }

    // Update the transaction status to "Approved"
    transaction.status = "Approved";
    await transaction.save();

    // Find the user associated with this transaction
    const user = transaction.user;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Increment the user's wallet balance
    user.wallet.balance = (user.wallet.balance || 0) + transaction.amount;
    await user.save();

    const adminAmount = await AdminAmount.findOne(); // Assumes single document
    if (adminAmount) {
      adminAmount.totalAmount += transaction.amount;
      adminAmount.currentAmount += transaction.amount;
      await adminAmount.save();
    } else {
      // Create if it doesn't exist
      await AdminAmount.create({
        totalAmount: transaction.amount,
        currentAmount: transaction.amount,
      });
    }

    res.status(200).json({
      message:
        "Transaction approved and user wallet balance updated successfully",
    });
  } catch (error) {
    // console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Decline a deposit request
exports.declineDepositRequest = async (req, res) => {
  const { transactionId } = req.params;

  try {
    const transaction = await Transactions.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status !== "In Process") {
      return res
        .status(400)
        .json({ message: "Transaction is not in 'In Process' state" });
    }

    transaction.status = "Declined";
    await transaction.save();

    res.status(200).json({ message: "Transaction declined successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all withdrwal requests and populate user
exports.getAllWithdrawlRequests = async (req, res) => {
  try {
    const withdrawals = await Transactions.find({
      status: "In Process",
      transactionType: "Withdrawal",
    })
      .populate("user") // Adjust fields as needed
      .sort({ createdAt: -1 }); // Sorting by most recent

    res.status(200).json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Approve a withdraw request
exports.approveWithdrawRequest = async (req, res) => {
  const { transactionObjId } = req.params;
  const { transactionId } = req.body;

  try {
    // Find the transaction and populate the user details
    const transaction = await Transactions.findById(transactionObjId).populate(
      "user"
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Check if the transaction is in "In Process" state
    if (transaction.status !== "In Process") {
      return res
        .status(400)
        .json({ message: "Transaction is not in 'In Process' state" });
    }

    // Update the transaction status to "Approved"
    transaction.status = "Approved";
    transaction.transactionId = transactionId;
    await transaction.save();
    const adminAmount = await AdminAmount.findOne();
    adminAmount.currentAmount -= transaction.amount;
    await adminAmount.save();
    res.status(200).json({
      message: "Transaction approved ",
    });
  } catch (error) {
    // console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Decline a withdrw request
exports.declineWithdrawRequest = async (req, res) => {
  const { transactionObjId } = req.params;

  try {
    // Find the transaction and populate the user field
    const transaction = await Transactions.findById(transactionObjId).populate(
      "user"
    );

    // Check if the transaction exists
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Check if the transaction is in the 'In Process' state
    if (transaction.status !== "In Process") {
      return res
        .status(400)
        .json({ message: "Transaction is not in 'In Process' state" });
    }

    // Update the transaction status to 'Declined'
    transaction.status = "Declined";

    // Save the updated transaction
    await transaction.save();

    // Find the user and update the wallet balance
    const user = transaction.user;
    if (user) {
      user.wallet.balance += transaction.amount;

      // Save the updated user
      await user.save();
    } else {
      return res
        .status(500)
        .json({ message: "User associated with the transaction not found" });
    }

    // Send a successful response
    res
      .status(200)
      .json({ message: "Transaction declined and user balance updated" });
  } catch (error) {
    // Log and respond with an error message
    console.error("Error declining transaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all transactions with pagination
exports.getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    // Fetch transactions with pagination
    const transactions = await Transactions.find()
      .populate("user", "-password") // Populate user data excluding the password
      .sort({ createdAt: -1 }) // Sort by most recent
      .skip((page - 1) * limit) // Skip the records for pagination
      .limit(parseInt(limit)); // Limit the number of records per page

    // Get the total count for pagination
    const totalTransactions = await Transactions.countDocuments();

    res.status(200).json({
      transactions,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalTransactions / limit),
      totalTransactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};

//--------------------------------------------------- DASHBOARD-----------------------------------------------------------------

exports.getDashboardMoneyAnalytics = async (req, res) => {
  try {
    const analytics = await AdminAmount.findOne();
    res.status(200).json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: error.message,
    });
  }
};

//----------------------------------------------------Banner--------------------------------------------

//get banners
exports.getbanners = async (req, res) => {
  try {
    const bannersURL = await Banner.findOne();
    const banners = bannersURL.bannerImg;
    res.status(200).json({ success: true, banners });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch banners",
      error: error.message,
    });
  }
};

// adding banners
exports.addBanner = async (req, res) => {
  try {
    const { bannerImg } = req.body;
    const banners = await Banner.findOne();
    banners.bannerImg.push(bannerImg);
    await banners.save();
    res
      .status(200)
      .json({ success: true, message: "Image added successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: error.message,
    });
  }
};

//updating Banners

exports.updateBannerImages = async (req, res) => {
  try {
    const images = req.files; // New images uploaded via Multer
    const alreadyExistingBanners = req.body.banners; // Existing banners from the frontend (URLs)

    let bannerDoc = await Banner.findOne(); // Find the existing banner document

    if (!bannerDoc) {
      // If no document exists, create a new one
      bannerDoc = new Banner();
    }

    // Clear the existing images
    bannerDoc.bannerImg = [];

    // Add already existing banners from the frontend if they exist
    if (alreadyExistingBanners && alreadyExistingBanners.length > 0) {
      bannerDoc.bannerImg.push(...alreadyExistingBanners);
    }

    // Add new images if they exist
    if (images && images.length > 0) {
      images.forEach((item) => {
        bannerDoc.bannerImg.push(item.path);
      });
    }

    // Ensure there are at least 3 images before saving
    if (bannerDoc.bannerImg.length < 3) {
      return res.status(400).json({
        message: "At least 3 images are required",
      });
    }

    // Save the updated banner document
    await bannerDoc.save();

    res.status(200).json({
      message: "Banner images updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update banner images",
      error: error.message,
    });
  }
};
