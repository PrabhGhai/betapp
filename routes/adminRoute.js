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

//get all transactions
router.get(
  "/getAllTransactions",
  authMiddleware.verifyToken, // Ensure only authenticated users can access
  adminController.getAllTransactions
);

// Approve a deposit request
router.patch(
  "/approveDepositRequest/:transactionId",
  authMiddleware.verifyToken, // Ensure only authenticated users can access
  adminController.approveDepositRequest
);

// Decline a deposit request
router.patch(
  "/declineDepositRequest/:transactionId",
  authMiddleware.verifyToken, // Ensure only authenticated users can access
  adminController.declineDepositRequest
);

//all in process withdrawl requests
router.get(
  "/getAllWithdrawlRequests",
  authMiddleware.verifyToken, // Ensure only authenticated users can access
  adminController.getAllWithdrawlRequests
);

//all in process withdrawl requests
router.patch(
  "/approveWithdrawRequest/:transactionObjId",
  authMiddleware.verifyToken, // Ensure only authenticated users can access
  adminController.approveWithdrawRequest
);

router.patch(
  "/declineWithdrawRequest/:transactionObjId",
  authMiddleware.verifyToken, // Ensure only authenticated users can access
  adminController.declineWithdrawRequest
);
module.exports = router;
