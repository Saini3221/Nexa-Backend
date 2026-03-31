const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer"); // ✅ Import multer
const blogController = require("../controllers/blogController");

// Image upload route (separate)
router.post("/upload-image", upload.single("image"), blogController.uploadImage);

// Blog routes with file upload support
router.post("/", upload.single("image"), blogController.createBlog);
router.get("/", blogController.getBlogs);
router.get("/:id", blogController.getBlogById);
router.put("/:id", upload.single("image"), blogController.updateBlog);
router.delete("/:id", blogController.deleteBlog);

module.exports = router;