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

router.get(
  "/getUserPaymentHistory",
  authMiddleware.verifyToken,
  transactionController.getUserPaymentHistory
);

router.patch(
  "/withdrawAmountRequest",
  authMiddleware.verifyToken,
  transactionController.withdrawAmountRequest
);
module.exports = router;
