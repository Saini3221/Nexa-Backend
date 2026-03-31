const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    pageId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    pageName: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    icon: {
      type: String,
      default: "DocumentTextIcon"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Page", pageSchema);