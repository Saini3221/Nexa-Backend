const SeoUser = require("../models/SeoUser");

// Get all SEO users
exports.getAllSeoUsers = async (req, res) => {
  try {
    const users = await SeoUser.find({}, { password: 1, email: 1, createdAt: 1 }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Create a new SEO user
exports.createSeoUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if user already exists
    const existingUser = await SeoUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "SEO User already exists with this email" });
    }

    const newUser = new SeoUser({ email, password });
    await newUser.save();

    res.status(201).json({ message: "SEO User created successfully", user: { email: newUser.email, _id: newUser._id } });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update SEO user (including password)
exports.updateSeoUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const updateData = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password;

    const user = await SeoUser.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "SEO User not found" });
    }

    res.json({ message: "SEO User updated successfully", user: { email: user.email, _id: user._id } });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete SEO user
exports.deleteSeoUser = async (req, res) => {
  try {
    const user = await SeoUser.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "SEO User not found" });
    }
    res.json({ message: "SEO User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
