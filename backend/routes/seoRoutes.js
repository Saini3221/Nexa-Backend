const express = require("express");
const router = express.Router();
const seoController = require("../controllers/seoController");
const seoUserController = require("../controllers/seoUserController");
const SeoUser = require("../models/SeoUser");

// Authentication Middleware
const isSeoAuthorized = async (req, res, next) => {
  console.log("🛡️ SEO Middleware: Checking access for", req.path);
  
  // 1. Allow full Admin immediately
  if (req.session && req.session.admin) {
    console.log("🛡️ SEO Middleware: Access GRANTED (Admin)");
    return next();
  }

  // 2. If it's an SEO user, verify they still exist in the database
  if (req.session && req.session.seoUser && req.session.seoUser._id) {
    try {
      const user = await SeoUser.findById(req.session.seoUser._id);
      if (user) {
        console.log("🛡️ SEO Middleware: Access GRANTED (SEO Specialist:", user.email, ")");
        return next();
      }
      
      console.log("🛡️ SEO Middleware: Access DENIED (User deleted)");
      req.session.seoUser = null;
      return res.status(401).json({ message: "Session invalid: User record deleted" });
    } catch (error) {
      console.error("🛡️ SEO Middleware: Error during access check", error);
      return res.status(500).json({ message: "Auth Error", error: error.message });
    }
  }

  console.log("🛡️ SEO Middleware: Access DENIED (Unauthorized)");
  res.status(401).json({ message: "Unauthorized: SEO or Admin access required" });
};

// Main Admin Only Middleware
const isAdmin = (req, res, next) => {
  if (req.session && req.session.admin) {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Admin access only" });
  }
};

// SEO Login Route (Dynamic)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check SEO User model
    const user = await SeoUser.findOne({ email });
    if (user && user.password === password) {
      req.session.seoUser = {
        _id: user._id, // Add ID for better tracking
        email,
        loginTime: new Date().toISOString()
      };
      return res.json({ message: "SEO Login Successful", user: { email } });
    }
    
    res.status(401).json({ message: "Invalid SEO Credentials" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Check SEO Auth (Strict)
router.get("/check-auth", async (req, res) => {
  console.log("🔍 SEO Auth Check - Session ID:", req.sessionID);
  console.log("👤 Session Data:", { admin: !!req.session?.admin, seoUser: !!req.session?.seoUser });

  try {
    // 1. Check if Admin is logged in
    if (req.session && req.session.admin) {
      console.log("✅ Auth Passed: Main Admin session found");
      return res.json({ 
        authenticated: true, 
        user: req.session.admin,
        type: 'admin'
      });
    }

    // 2. Check if SEO user is logged in AND still exists in DB
    if (req.session && req.session.seoUser && req.session.seoUser._id) {
      const user = await SeoUser.findById(req.session.seoUser._id);
      if (user) {
        console.log("✅ Auth Passed: SEO Specialist session found -", user.email);
        return res.json({ 
          authenticated: true, 
          user: { email: user.email, _id: user._id },
          type: 'seo'
        });
      }
      
      console.log("❌ Auth Failed: SEO User record not found in DB");
      req.session.seoUser = null;
    } else {
      console.log("❌ Auth Failed: No valid session data (Admin or SEO) found");
    }
    
    res.status(401).json({ authenticated: false, message: "Invalid or expired session" });
  } catch (error) {
    console.error("🔥 Auth Check Error:", error);
    res.status(500).json({ authenticated: false, message: "Server auth error" });
  }
});

// SEO Logout
router.post("/logout", (req, res) => {
  if (req.session?.seoUser) {
    req.session.seoUser = null;
    return res.json({ message: "SEO Logout successful" });
  }
  res.status(400).json({ message: "No active SEO session" });
});

/* SEO USER MANAGEMENT (Admin Only) */
router.get("/users", isAdmin, seoUserController.getAllSeoUsers);
router.post("/users", isAdmin, seoUserController.createSeoUser);
router.put("/users/:id", isAdmin, seoUserController.updateSeoUser);
router.delete("/users/:id", isAdmin, seoUserController.deleteSeoUser);

// Public Route
router.get("/:url", seoController.getSeoByUrl);

// Protected SEO/Admin Routes (The SEO records themselves)
router.get("/", isSeoAuthorized, seoController.getAllSeo);
router.post("/", isSeoAuthorized, seoController.createSeo);
router.put("/:id", isSeoAuthorized, seoController.updateSeo);
router.delete("/:id", isSeoAuthorized, seoController.deleteSeo);

// Protected Bulk Update
router.post("/bulk-auto-services", isSeoAuthorized, seoController.bulkAutoUpdateServices);

// Publicly accessible but controlled update
router.post("/auto-update", seoController.autoUpdateSeo);

module.exports = router;
