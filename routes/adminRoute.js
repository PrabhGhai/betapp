const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const uploadBanners = require("../middlewares/uploadBanners");
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

//declinewithdrawl request
router.patch(
  "/declineWithdrawRequest/:transactionObjId",
  authMiddleware.verifyToken, // Ensure only authenticated users can access
  adminController.declineWithdrawRequest
);

//-------------------------------------------------------------DASHBOARD---------------------------------
router.get(
  "/getDashboardMoneyAnalytics",
  authMiddleware.verifyToken,
  authMiddleware.authorizeRole("admin"),
  adminController.getDashboardMoneyAnalytics
);

//----------------------------------------------------Banner Settings-------------------------------------
//get banners
router.get("/getBanners", adminController.getbanners);

router.patch(
  "/addBanner",
  authMiddleware.verifyToken,
  authMiddleware.authorizeRole("admin"),
  adminController.addBanner
);

// Route to update banner images
router.patch(
  "/updateBanner",
  authMiddleware.verifyToken,
  authMiddleware.authorizeRole("admin"),
  uploadBanners.array("banners", 10),
  adminController.updateBannerImages
);

module.exports = router;
