const mongoose = require('mongoose');

const subItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  path: { type: String },
  type: { type: String, enum: ['link', 'dropdown'], default: 'link' }
});

subItemSchema.add({
  dropdown: [subItemSchema]
});

const navItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  path: { type: String },
  type: { type: String, enum: ['link', 'dropdown'], required: true },
  dropdown: [subItemSchema],
  order: { type: Number, default: 0 }
});

const navbarSchema = new mongoose.Schema({
  items: [navItemSchema],
  version: { type: Number, default: 1 },
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: String, default: 'system' } // You can change this to ObjectId if you have user model
}, {
  timestamps: true
});

module.exports = mongoose.model('Navbar', navbarSchema);