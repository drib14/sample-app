const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'maki_posts',
    resource_type: 'auto', // allows image and video
  },
});

const messageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'maki_messages',
    resource_type: 'auto', // allows image, video, raw files
  },
});

// Max 20MB per file
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

const messageUpload = multer({
  storage: messageStorage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

module.exports = { cloudinary, upload, messageUpload };
