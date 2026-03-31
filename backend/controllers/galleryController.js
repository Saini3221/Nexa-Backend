const Gallery = require("../models/Gallery");

// Create Image
exports.createImage = async (req, res) => {
  try {
    const { image, title } = req.body;

    const newImage = new Gallery({
      image,
      title,
    });

    await newImage.save();

    res.status(201).json({
      success: true,
      message: "Image Uploaded Successfully",
      data: newImage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Images
exports.getImages = async (req, res) => {
  try {
    const images = await Gallery.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Image
exports.updateImage = async (req, res) => {
  try {
    const updated = await Gallery.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Image
exports.deleteImage = async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ message: "Image Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
