const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const uploadAvatar = require("../middlewares/uploadMiddleware");

// Request OTP
router.post("/request-otp", authController.requestOtp);

// Verify OTP
router.post("/verify-otp", authController.verifyOtp);

// Login
router.post("/login", authController.login);

// Logout
router.post("/logout", authController.logout);

// Check cookie presence
router.get("/check-cookie", authController.checkCookie);

//profile
router.get(
  "/profile",
  authMiddleware.verifyToken,
  authController.getUserProfile
);

//update profile
router.post(
  "/update-profile",
  authMiddleware.verifyToken,
  uploadAvatar.single("avatar"),
  authController.updateProfile
);

//change password
router.post(
  "/change-password",
  authMiddleware.verifyToken,
  authController.changePassword
);

// Update bank account details
router.post(
  "/update-bank-account",
  authMiddleware.verifyToken,
  authController.updateBankAccountDetails
);

// Update UPI ID
router.post(
  "/update-upi-id",
  authMiddleware.verifyToken,
  authController.updateUpiId
);

// Get bank account details
router.get(
  "/bank-account-details",
  authMiddleware.verifyToken,
  authController.getBankAccountDetails
);

router.post("/forgot-password", authController.forgotPassword);
router.put("/reset-password/:token", authController.resetPassword);

module.exports = router;
