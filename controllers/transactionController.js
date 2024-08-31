const User = require("../models/user");
const Transaction = require("../models/transaction");

exports.manualTransaction = async (req, res) => {
  try {
    const { user } = req;
    const existingUser = await User.findById(user.id);

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { transactionId, amount } = req.body;
    let screenshot;
    if (req.file) {
      screenshot = req.file.path; // This should be the Cloudinary URL
    }

    if (!transactionId || !amount || !screenshot) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    // Check if the transaction ID is unique
    const existingTransaction = await Transaction.findOne({ transactionId });
    if (existingTransaction) {
      return res
        .status(409)
        .json({ error: "Payment with this transaction ID already exists" });
    }

    const newTransaction = new Transaction({
      transactionId,
      type: "manual",
      amount,
      screenshot,
      user: user.id,
      transactionType: "Deposit",
    });

    await newTransaction.save();

    await User.findByIdAndUpdate(user.id, {
      $push: { transactions: newTransaction._id },
    });

    return res.status(200).json({ message: "Transaction under review" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

// Get Payment History of User
exports.getUserPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const transactions = await Transaction.find({ user: userId })
      .select("-screenshot")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
    });
  }
};

//withdraw amount request by user
exports.withdrawAmountRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount } = req.body;

    // Validate the amount
    if (!amount) {
      return res.status(400).json({ error: "Please enter the amount." });
    }

    const existingUser = await User.findById(userId);

    // Check if the user has provided bank details or UPI ID
    if (!existingUser.bankAccountDetails && !existingUser.upiId) {
      return res
        .status(400)
        .json({ error: "Please fill in your bank details or UPI ID." });
    }

    // Check if the user's wallet balance is sufficient
    if (existingUser.wallet.balance < 300) {
      return res
        .status(400)
        .json({ error: "Your wallet balance is less than 300." });
    }

    // Check if the withdrawal amount is valid
    if (amount < 300) {
      return res
        .status(400)
        .json({ error: "The amount should be at least 300." });
    }

    // Check if the user's wallet balance is less than the amount he or she wants to withdraw
    if (existingUser.wallet.balance < amount) {
      return res
        .status(400)
        .json({
          error: "Your balance is less than the amount you want to withdraw",
        });
    }

    // Deduct the amount and save the transaction
    const withdrawTransaction = new Transaction({
      transactionType: "Withdrawal",
      type: "manual",
      amount,
      user: userId,
    });

    await withdrawTransaction.save();

    // Update user's transactions and wallet balance
    existingUser.transactions.push(withdrawTransaction._id);
    existingUser.wallet.balance -= amount;
    await existingUser.save();

    // Send success response
    res.status(200).json({
      success: true,
      message: "Your withdrawal request is being processed.",
    });
  } catch (error) {
    console.error("Error during withdrawal request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process the withdrawal request.",
    });
  }
};
