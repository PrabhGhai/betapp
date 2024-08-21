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

// Configure CORS with expanded settings
app.use(
  cors({
    origin: ["http://localhost:5173", "https://betwebapp.netlify.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"], // Specify allowed headers
    credentials: true, // Allow cookies to be sent
  })
);

// Serve static files if needed
// app.use("/uploads", express.static("uploads"));

// API routes
app.use("/api/v1", userApi);
app.use("/api/v1", adminApi);

// Handle preflight requests
app.options("*", cors());

// Start the server
app.listen(process.env.PORT, () => {
  console.log("Server started on port", process.env.PORT);
});
