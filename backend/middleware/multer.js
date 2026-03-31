// backend/middleware/multer.js
const multer = require('multer');

// Memory storage (buffer mein save hoga)
const storage = multer.memoryStorage();

// File filter - sirf images allow karega
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Multer upload config
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

module.exports = upload;