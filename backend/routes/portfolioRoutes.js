// backend/routes/portfolioRoutes.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");

const {
  getPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  uploadImage
} = require("../controllers/portfolioController");

// Routes
router.get("/", getPortfolios);
router.post("/", upload.single("image"), createPortfolio); // ✅ File upload support
router.put("/:id", updatePortfolio);
router.delete("/:id", deletePortfolio);

// Separate image upload route
router.post("/upload-image", upload.single("image"), uploadImage);

module.exports = router;