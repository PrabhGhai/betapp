const mongoose = require("mongoose");
require("dotenv").config();
const conn = async () => {
  await mongoose
    .connect(`${process.env.URI}`)
    .then(() => console.log("Connected to database"));
};
conn();
