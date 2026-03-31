const express = require("express");
const router = express.Router();
const galleryController = require("../controllers/galleryController");

router.post("/", galleryController.createImage);
router.get("/", galleryController.getImages);
router.put("/:id", galleryController.updateImage);
router.delete("/:id", galleryController.deleteImage);

module.exports = router;
