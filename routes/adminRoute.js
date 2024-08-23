const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/admin-login", adminController.adminLogin);
router.get(
  "/check-admin",
  authMiddleware.verifyToken,
  adminController.checkAdmin
);

router.get(
  "/getAllUsers",
  authMiddleware.verifyToken,
  adminController.getUsersInChunks
);

// Route to get all deposit requests Manual
router.get(
  "/getAllDepositsRequest",
  authMiddleware.verifyToken, // Ensure only authenticated users can access
  adminController.getAllDepositRequests
);
module.exports = router;
