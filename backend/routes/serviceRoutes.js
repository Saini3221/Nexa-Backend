const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer"); // ✅ Import multer (jo blog mein use ho raha hai)

const {
  addService,
  getAllServices,
  getServiceBySlug,
  getServiceById,
  updateService,
  deleteService,
  deleteMultipleServices,
  uploadImage // ✅ New controller for separate image upload
} = require("../controllers/serviceController");

// Separate image upload route (optional - same as blog)
router.post("/upload-image", upload.single("image"), uploadImage);

// Service routes with image upload support
router.post("/add", upload.single("heroImage"), addService);
router.get("/", getAllServices);
router.get("/slug/:slug", getServiceBySlug);
router.get("/:id", getServiceById);
router.put("/update/:id", upload.single("heroImage"), updateService);
router.delete("/delete/:id", deleteService);
router.delete("/delete-multiple", deleteMultipleServices);

module.exports = router;