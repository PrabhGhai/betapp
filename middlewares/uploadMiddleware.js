const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");
require("dotenv").config();
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "avatar-bet-app", // Folder name in Cloudinary
    format: async (req, file) => file.mimetype.split("/")[1], // Dynamic file format based on MIME type
    public_id: (req, file) =>
      `${Date.now()}-${file.originalname.split(".")[0]}`, // File name
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
});

//console.log(process.env.CLOUDINARY_API_SECRET);

module.exports = uploadAvatar;
