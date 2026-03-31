const Page = require("../models/Page");

// ========== GET ALL PAGES (ADMIN) ==========
exports.getAllPages = async (req, res) => {
  try {
    const pages = await Page.find().sort({ order: 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: pages
    });
  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== GET ACTIVE PAGES (FRONTEND) ==========
exports.getActivePages = async (req, res) => {
  try {
    const pages = await Page.find({ isActive: true }).sort({ order: 1 });
    
    res.json({
      success: true,
      data: pages
    });
  } catch (error) {
    console.error('Get active pages error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== CREATE NEW PAGE ==========
exports.createPage = async (req, res) => {
  try {
    const { pageId, pageName, description, icon } = req.body;
    
    if (!pageId || !pageName) {
      return res.status(400).json({
        success: false,
        message: "pageId and pageName are required"
      });
    }
    
    const existingPage = await Page.findOne({ pageId });
    if (existingPage) {
      return res.status(400).json({
        success: false,
        message: "Page with this ID already exists"
      });
    }
    
    const lastPage = await Page.findOne().sort({ order: -1 });
    const newOrder = lastPage ? lastPage.order + 1 : 0;
    
    const newPage = new Page({
      pageId: pageId.toLowerCase().replace(/\s+/g, '-'),
      pageName,
      description: description || "",
      icon: icon || "DocumentTextIcon",
      order: newOrder
    });
    
    await newPage.save();
    
    res.status(201).json({
      success: true,
      message: "Page created successfully",
      data: newPage
    });
  } catch (error) {
    console.error('Create page error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== UPDATE PAGE ==========
exports.updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (updateData.pageId) {
      const existingPage = await Page.findOne({ 
        pageId: updateData.pageId,
        _id: { $ne: id }
      });
      
      if (existingPage) {
        return res.status(400).json({
          success: false,
          message: "Page with this ID already exists"
        });
      }
    }
    
    updateData.updatedAt = Date.now();
    
    const page = await Page.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!page) {
      return res.status(404).json({ 
        success: false, 
        message: "Page not found" 
      });
    }
    
    res.json({
      success: true,
      message: "Page updated successfully",
      data: page
    });
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== DELETE PAGE ==========
exports.deletePage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const page = await Page.findById(id);
    if (!page) {
      return res.status(404).json({ 
        success: false, 
        message: "Page not found" 
      });
    }
    
    const Hero = require("../models/Hero");
    const heroesCount = await Hero.countDocuments({ pageId: page.pageId });
    
    if (heroesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete page. It has ${heroesCount} hero section(s). Delete them first.`
      });
    }
    
    await Page.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: "Page deleted successfully"
    });
  } catch (error) {
    console.error('Delete page error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== TOGGLE PAGE STATUS ==========
exports.togglePageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const page = await Page.findById(id);
    if (!page) {
      return res.status(404).json({ 
        success: false, 
        message: "Page not found" 
      });
    }
    
    page.isActive = !page.isActive;
    await page.save();
    
    res.json({
      success: true,
      message: `Page ${page.isActive ? 'activated' : 'deactivated'}`,
      data: page
    });
  } catch (error) {
    console.error('Toggle page error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== REORDER PAGES ==========
exports.reorderPages = async (req, res) => {
  try {
    const { pages } = req.body;
    
    for (const item of pages) {
      await Page.findByIdAndUpdate(item.id, { order: item.order });
    }
    
    const updatedPages = await Page.find().sort({ order: 1 });
    
    res.json({
      success: true,
      message: "Pages reordered successfully",
      data: updatedPages
    });
  } catch (error) {
    console.error('Reorder pages error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};