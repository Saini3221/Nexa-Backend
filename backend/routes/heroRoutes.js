const express = require("express");
const router = express.Router();
const multer = require("multer");
const heroController = require("../controllers/heroController");

const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Public routes
router.get("/page/:pageId", heroController.getHeroesByPage);
router.get("/single/:id", heroController.getHeroById);

// Admin routes
router.get("/admin/all", heroController.getAllHeroes);
router.post("/admin/create", heroController.createHero);
router.put("/admin/:id", heroController.updateHero);
router.post("/admin/:id/images", upload.array('images', 10), heroController.uploadHeroImages);
router.delete("/admin/:heroId/images/:imageId", heroController.deleteHeroImage);
router.post("/admin/:heroId/images/reorder", heroController.reorderImages);
router.post("/admin/:id/duplicate", heroController.duplicateHero);
router.patch("/admin/:id/toggle", heroController.toggleHeroStatus);
router.delete("/admin/:id", heroController.deleteHero);

module.exports = router;