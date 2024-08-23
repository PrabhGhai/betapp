const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    avatar: {
      type: String,
      required: false,
      default: "",
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
    },
    bankAccountDetails: {
      accountHolderName: {
        type: String,
        required: false,
      },
      accountNumber: {
        type: String,
        required: false,
      },
      bankName: {
        type: String,
        required: false,
      },
      ifscCode: {
        type: String,
        required: false,
      },
    },
    upiId: {
      type: String,
      required: false,
    },
    bettingHistory: [
      {
        betId: {
          type: Schema.Types.ObjectId,
          ref: "Bet", // Assuming you have a Bet model
        },
        amount: {
          type: Number,
          required: true,
        },
        choice: {
          type: String,
          enum: ["yes", "no"], // or any other choices
          required: true,
        },
        result: {
          type: String,
          enum: ["won", "lost", "pending"],
          required: false,
        },
        winnings: {
          type: Number,
          required: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    wallet: {
      balance: {
        type: Number,
        default: 0,
      },
    },
    spent: {
      type: Number,
      default: 0,
    },
    transactions: [{ type: Schema.Types.ObjectId, ref: "Transactions" }],
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    resetPasswordToken: {
      type: String,
      required: false,
    },
    resetPasswordExpires: {
      type: Date,
      required: false,
    },
    suspend: {
      type: Boolean,
      default: false,
    },
    ipAddress: { type: String, default: "" },
    signInHistory: [{ type: Date }],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
