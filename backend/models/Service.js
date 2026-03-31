const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    pageTitle: {
      type: String,
      required: [true, "Page title is required"],
      trim: true,
    },
    miniDescription: {
      type: String,
      trim: true,
      default: "",
    },
    buttonText: {
      type: String,
      trim: true,
      default: "",
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Rich Text Fields - Sirf yeh extra fields add ki hain
    heroHeading: {
      text: { type: String, default: "" },
      type: { type: String, default: "h1" },
      color: { type: String, default: "#ffffff" },
      fontSize: { type: String, default: "48px" },
      fontWeight: { type: String, default: "bold" },
      alignment: { type: String, default: "left" }
    },
    heroParagraphs: [{
      text: { type: String, default: "" },
      color: { type: String, default: "#d1d5db" },
      fontSize: { type: String, default: "18px" },
      fontWeight: { type: String, default: "normal" },
      fontStyle: { type: String, default: "normal" },
      textDecoration: { type: String, default: "none" }
    }],
    heroImage: { type: String, default: "" },
    heroImageAlt: { type: String, default: "" }
  },
  { 
    timestamps: true,
  }
);

module.exports = mongoose.model("Service", serviceSchema);