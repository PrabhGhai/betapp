const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const banner = new Schema({
  bannerImg: [{ type: String }],
});

module.exports = mongoose.model("banner", banner);
