const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    transactionId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["manual"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    screenshot: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    success: {
      type: Boolean,
      deafult: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transactions", transactionSchema);
