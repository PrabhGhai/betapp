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
module.exports = router;
