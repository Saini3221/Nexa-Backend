const express = require("express");
const router = express.Router();
const pageController = require("../controllers/pageController");

// Public routes
router.get("/active", pageController.getActivePages);

// Admin routes
router.get("/admin/all", pageController.getAllPages);
router.post("/admin/create", pageController.createPage);
router.put("/admin/:id", pageController.updatePage);
router.delete("/admin/:id", pageController.deletePage);
router.patch("/admin/:id/toggle", pageController.togglePageStatus);
router.post("/admin/reorder", pageController.reorderPages);

module.exports = router;