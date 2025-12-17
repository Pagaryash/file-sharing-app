const multer = require("multer");

// store in memory (buffer) so we can push directly to Cloudinary
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/csv",
];

function fileFilter(req, file, cb) {
  if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type"), false);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

module.exports = upload;
