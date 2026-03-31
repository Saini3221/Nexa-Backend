// backend/controllers/portfolioController.js
const Portfolio = require("../models/Portfolio");
const cloudinary = require("../config/cloudinary");

// GET all portfolios
const getPortfolios = async (req, res) => {
  try {
    const portfolios = await Portfolio.find().sort({ createdAt: -1 });
    res.json(portfolios);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// CREATE portfolio with image upload
const createPortfolio = async (req, res) => {
  try {
    const { title, category, link } = req.body;
    let imageUrl = req.body.image;

    // Agar file upload hui hai to Cloudinary pe upload karo
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'portfolio',
        resource_type: 'auto'
      });
      imageUrl = result.secure_url;
    }

    // Validation
    if (!title || !category || !imageUrl) {
      return res.status(400).json({ 
        message: "Title, category and image are required" 
      });
    }

    // Create new portfolio
    const newPortfolio = new Portfolio({
      title,
      category,
      image: imageUrl,
      link: link || "",
    });

    await newPortfolio.save();

    res.status(201).json({
      success: true,
      message: "Portfolio created successfully",
      data: newPortfolio
    });

  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ message: "Error creating portfolio" });
  }
};

// UPDATE portfolio
const updatePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, image, link } = req.body;

    const updated = await Portfolio.findByIdAndUpdate(
      id,
      { title, category, image, link },
      { new: true }
    );

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating portfolio" });
  }
};

// DELETE portfolio
const deletePortfolio = async (req, res) => {
  try {
    await Portfolio.findByIdAndDelete(req.params.id);
    res.json({ message: "Portfolio deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting portfolio" });
  }
};

// Image upload only (optional)
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'portfolio',
      resource_type: 'auto'
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  getPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  uploadImage
};