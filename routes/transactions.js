const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const uploadScreenshots = require("../middlewares/uploadScreenshots");
const transactionController = require("../controllers/transactionController");

// Manual payment route
router.post(
  "/manual-payment",
  authMiddleware.verifyToken,
  uploadScreenshots.single("screenshot"),
  transactionController.manualTransaction
);

module.exports = router;
