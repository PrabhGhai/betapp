const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    transactionType: {
      type: String,
      enum: ["Deposit", "Withdrawl"],
    },
    transactionId: {
      type: String,
    },
    type: {
      type: String,
      enum: ["manual"],
    },
    amount: {
      type: Number,
      required: true,
    },
    screenshot: {
      type: String,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      default: "In Process",
      enum: ["In Process", "Approved", "Declined"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transactions", transactionSchema);
