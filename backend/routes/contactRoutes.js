// routes/contactRoutes.js
const express = require("express");
const router = express.Router();

const {
  createContact,
  getContacts,
  deleteContact,
  markAsRead,
  getContactById,  // Optional: agar single contact dekhna ho
} = require("../controllers/contactController");

// Optional: Authentication middleware agar admin routes protected hain
// const { protect, admin } = require("../middleware/authMiddleware");

/* PUBLIC ROUTES */
router.post("/", createContact);

/* ADMIN ROUTES */
// Agar authentication lagana hai toh:
// router.get("/", protect, admin, getContacts);
router.get("/", getContacts);
router.get("/:id", getContactById); // Optional: single contact
router.delete("/:id", deleteContact);
router.patch("/:id/read", markAsRead);

module.exports = router;