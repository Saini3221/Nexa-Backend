const Navbar = require('../models/Navbar');

// Default navbar structure
const defaultNavItems = [
  { id: "1", name: "Home", path: "/", type: "link" },
  { id: "2", name: "Blog", path: "/blog", type: "link" },
  { 
    id: "3", 
    name: "Services", 
    type: "dropdown",
    dropdown: [
      { id: "3-1", name: "New York", path: "/services/new-york" },
      { id: "3-2", name: "USA", path: "/services/usa" }
    ]
  },
  { id: "4", name: "About", path: "/about", type: "link" },
  { id: "5", name: "Contact", path: "/contact", type: "link" },
];

// @desc    Get navbar items
// @route   GET /api/navbar
// @access  Public
const getNavbar = async (req, res) => {
  try {
    let navbar = await Navbar.findOne().sort({ createdAt: -1 });
    
    if (!navbar) {
      navbar = await Navbar.create({ 
        items: defaultNavItems,
        version: 1 
      });
    }
    
    res.json({ 
      success: true, 
      data: navbar.items,
      version: navbar.version,
      lastUpdated: navbar.lastUpdated 
    });
  } catch (error) {
    console.error('Error fetching navbar:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching navbar' 
    });
  }
};

// @desc    Update navbar items
// @route   PUT /api/navbar
// @access  Private (Admin only)
const updateNavbar = async (req, res) => {
  try {
    const { items } = req.body;
    
    // Validation
    if (!Array.isArray(items)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid data format - items must be an array' 
      });
    }

    // Validate each item structure
    const isValid = items.every(item => 
      item.id && 
      item.name && 
      ['link', 'dropdown'].includes(item.type)
    );

    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid item structure - each item must have id, name, and valid type' 
      });
    }

    // Get latest version for version increment
    const latestNavbar = await Navbar.findOne().sort({ createdAt: -1 });
    const newVersion = latestNavbar ? latestNavbar.version + 1 : 1;

    // Get admin info from session (using your existing session structure)
    const updatedBy = req.session.admin ? 
      req.session.admin.email : 
      'Unknown Admin';

    // Create new version
    const navbar = await Navbar.create({
      items,
      version: newVersion,
      lastUpdated: new Date(),
      updatedBy
    });

    res.json({ 
      success: true, 
      message: 'Navbar updated successfully',
      data: navbar.items,
      version: navbar.version,
      lastUpdated: navbar.lastUpdated
    });
  } catch (error) {
    console.error('Error updating navbar:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating navbar' 
    });
  }
};

// @desc    Reset navbar to default
// @route   POST /api/navbar/reset
// @access  Private (Admin only)
const resetNavbar = async (req, res) => {
  try {
    // Get latest version
    const latestNavbar = await Navbar.findOne().sort({ createdAt: -1 });
    const newVersion = latestNavbar ? latestNavbar.version + 1 : 1;

    // Get admin info from session
    const updatedBy = req.session.admin ? 
      req.session.admin.email : 
      'Unknown Admin';

    const navbar = await Navbar.create({
      items: defaultNavItems,
      version: newVersion,
      lastUpdated: new Date(),
      updatedBy
    });

    res.json({ 
      success: true, 
      message: 'Navbar reset to default successfully',
      data: navbar.items,
      version: navbar.version
    });
  } catch (error) {
    console.error('Error resetting navbar:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while resetting navbar' 
    });
  }
};

// @desc    Get navbar version history
// @route   GET /api/navbar/history
// @access  Private (Admin only)
const getNavbarHistory = async (req, res) => {
  try {
    const history = await Navbar.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('items version lastUpdated updatedBy createdAt');
    
    res.json({ 
      success: true, 
      data: history 
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching history' 
    });
  }
};

// @desc    Get specific version
// @route   GET /api/navbar/version/:version
// @access  Private (Admin only)
const getNavbarVersion = async (req, res) => {
  try {
    const { version } = req.params;
    
    const navbar = await Navbar.findOne({ version: parseInt(version) });
    
    if (!navbar) {
      return res.status(404).json({ 
        success: false, 
        message: 'Version not found' 
      });
    }

    res.json({ 
      success: true, 
      data: navbar 
    });
  } catch (error) {
    console.error('Error fetching version:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching version' 
    });
  }
};

// @desc    Restore to specific version
// @route   POST /api/navbar/restore/:version
// @access  Private (Admin only)
const restoreNavbarVersion = async (req, res) => {
  try {
    const { version } = req.params;
    
    const versionToRestore = await Navbar.findOne({ version: parseInt(version) });
    
    if (!versionToRestore) {
      return res.status(404).json({ 
        success: false, 
        message: 'Version not found' 
      });
    }

    // Get latest version for new version number
    const latestNavbar = await Navbar.findOne().sort({ createdAt: -1 });
    const newVersion = latestNavbar ? latestNavbar.version + 1 : 1;

    // Get admin info from session
    const updatedBy = req.session.admin ? 
      req.session.admin.email : 
      'Unknown Admin';

    // Create new version with restored items
    const navbar = await Navbar.create({
      items: versionToRestore.items,
      version: newVersion,
      lastUpdated: new Date(),
      updatedBy,
      restoredFrom: parseInt(version)
    });

    res.json({ 
      success: true, 
      message: `Restored to version ${version} successfully`,
      data: navbar.items,
      version: navbar.version
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while restoring version' 
    });
  }
};

// @desc    Get current active version info
// @route   GET /api/navbar/info
// @access  Public
const getNavbarInfo = async (req, res) => {
  try {
    const latestNavbar = await Navbar.findOne().sort({ createdAt: -1 });
    
    if (!latestNavbar) {
      return res.json({ 
        success: true, 
        data: {
          totalVersions: 0,
          currentVersion: 1,
          lastUpdated: null,
          updatedBy: null
        }
      });
    }

    const totalVersions = await Navbar.countDocuments();

    res.json({ 
      success: true, 
      data: {
        totalVersions,
        currentVersion: latestNavbar.version,
        lastUpdated: latestNavbar.lastUpdated,
        updatedBy: latestNavbar.updatedBy
      }
    });
  } catch (error) {
    console.error('Error fetching navbar info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching info' 
    });
  }
};

module.exports = {
  getNavbar,
  updateNavbar,
  resetNavbar,
  getNavbarHistory,
  getNavbarVersion,
  restoreNavbarVersion,
  getNavbarInfo
};