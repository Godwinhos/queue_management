const multer = require("multer")
const crypto = require("crypto")
const path = require("path")

const acceptedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"])
const extensions = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" }

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, `${crypto.randomUUID()}${extensions[file.mimetype] || path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!acceptedMimeTypes.has(file.mimetype)) return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "image"))
    cb(null, true)
  }
})

module.exports = upload
