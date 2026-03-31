const mongoose = require("mongoose");

const seoSchema = new mongoose.Schema({
  pageUrl: {
    type: String,
    required: true,
    unique: true, // Ensuring each URL has only one SEO entry
  },
  metaTitle: {
    type: String,
    required: true,
  },
  metaDescription: {
    type: String,
    required: true,
  },
  metaKeywords: {
    type: String,
  },
  canonicalUrl: {
    type: String, // Preferred URL for the search engine
  },
  robotsTag: {
    type: String, // Robots meta tag (index, follow, etc.)
    default: "index, follow",
  },
  createdBy: {
    type: String, // Email of the original creator
  },
  updatedBy: {
    type: String, // Email of the person who last updated it
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Seo", seoSchema);
