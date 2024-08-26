const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminAmount = new Schema({
  totalAmount: {
    type: Number,
    default: 0,
  },
  currentAmount: {
    type: Number,
    default: 0,
  },
  profit: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("adminAmount", adminAmount);
