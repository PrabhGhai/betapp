const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");
require("dotenv").config();

// Cloudinary storage configuration for banner images
const BannerStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "banners", // Folder name in Cloudinary
    format: async (req, file) => file.mimetype.split("/")[1], // Dynamic file format based on MIME type
    public_id: (req, file) =>
      `banner-${Date.now()}-${file.originalname.split(".")[0]}`, // Unique file name with timestamp
  },
});

// Multer configuration with Cloudinary storage for banners
const uploadBanners = multer({
  storage: BannerStorage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
});

module.exports = uploadBanners;
