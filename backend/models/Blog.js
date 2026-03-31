const mongoose = require("mongoose");
 
const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    sections: [
      {
        type: { type: String, enum: ['text', 'image'], required: true },
        content: { type: String, required: true } // Text content or Image URL
      }
    ],
    views: {
      type: Number,
      default: 0
    },
    image: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      default: "Admin",
    },
    category: {
      type: String,
      default: "City Guide",
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);
