const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Avatar uploads
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'nexus_lms/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
})

// Assignment screenshot uploads
const screenshotStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'nexus_lms/submissions',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
})

// Course thumbnail uploads
const thumbnailStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'nexus_lms/thumbnails',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 450, crop: 'fill' }],
  },
})

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
})

const uploadScreenshot = multer({
  storage: screenshotStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})

const uploadThumbnail = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
})

module.exports = { cloudinary, uploadAvatar, uploadScreenshot, uploadThumbnail }
