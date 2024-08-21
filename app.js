const express = require("express");
const app = express();
const userApi = require("./routes/user");
const adminApi = require("./routes/adminRoute");
const cors = require("cors");
const cookieParser = require("cookie-parser");

require("dotenv").config();
require("./conn/conn");
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));

//api calling
app.use("/api/v1", userApi);
app.use("/api/v1", adminApi);
//port no.
app.listen(process.env.PORT, () => {
  console.log("Server started");
});
