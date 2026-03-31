const express = require('express');
const router = express.Router();
const {
  getNavbar,
  updateNavbar,
  resetNavbar,
  getNavbarHistory,
  getNavbarVersion,
  restoreNavbarVersion,
  getNavbarInfo
} = require('../controllers/navbarController');

// Middleware to check if admin is logged in (using your existing session structure)
const isAdmin = (req, res, next) => {
  console.log('Checking admin access...');
  console.log('Session admin:', req.session.admin);
  
  // Check if admin is logged in (using your session.admin)
  if (req.session.admin) {
    console.log('Admin access granted for:', req.session.admin.email);
    next();
  } else {
    console.log('Admin access denied - not logged in');
    res.status(401).json({ 
      success: false, 
      message: 'Not authorized as admin. Please login first.' 
    });
  }
};

// Public routes (no login required)
router.get('/', getNavbar);
router.get('/info', getNavbarInfo);

// Admin only routes (login required)
router.put('/', isAdmin, updateNavbar);
router.post('/reset', isAdmin, resetNavbar);
router.get('/history', isAdmin, getNavbarHistory);
router.get('/version/:version', isAdmin, getNavbarVersion);
router.post('/restore/:version', isAdmin, restoreNavbarVersion);

module.exports = router;