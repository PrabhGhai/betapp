const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");
require("dotenv").config();

// Cloudinary storage configuration for QR code screenshots
const QRstorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "payments-bet-app", // Folder name in Cloudinary
    format: async (req, file) => file.mimetype.split("/")[1], // Dynamic file format based on MIME type
    public_id: (req, file) =>
      `${Date.now()}-${file.originalname.split(".")[0]}`, // Unique file name with timestamp
  },
});

// Multer configuration with Cloudinary storage
const uploadScreenshots = multer({
  storage: QRstorage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
});
module.exports = uploadScreenshots;
