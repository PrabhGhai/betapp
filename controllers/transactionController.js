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
