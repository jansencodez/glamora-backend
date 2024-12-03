const multer = require("multer");
const path = require("path");

// Set up multer for multiple file upload handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024, files: 100 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }
    cb(null, true);
  },
}).array("images", 100);

module.exports = upload;
