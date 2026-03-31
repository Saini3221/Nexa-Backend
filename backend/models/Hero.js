const mongoose = require("mongoose");

const heroImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String
  },
  alt: {
    type: String,
    default: "Hero image"
  },
  order: {
    type: Number,
    default: 0
  }
});

const heroSchema = new mongoose.Schema(
  {
    pageId: {
      type: String,
      required: true
      // ⚠️ ENUM HATA DITTA - hun dynamic pages aa sakde
    },
    pageName: {
      type: String,
      required: true
    },
    heroName: {
      type: String,
      required: true,
      default: function () {
        return `${this.pageName} Hero - ${new Date().toLocaleDateString()}`;
      }
    },
    title: {
      type: String,
      required: true,
      default: "Welcome to Our Website"
    },
    subtitle: {
      type: String,
      default: "We create amazing digital experiences"
    },
    description: {
      type: String,
      default: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
    },
    images: [heroImageSchema],
    backgroundImage: {
      type: String,
      default: ""
    },
    backgroundVideo: {
      type: String,
      default: ""
    },
    backgroundType: {
      type: String,
      enum: ['image', 'video', 'color', 'slider'],
      default: 'image'
    },
    backgroundColor: {
      type: String,
      default: '#0c0c16'
    },
    overlayOpacity: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    textColor: {
      type: String,
      default: '#ffffff'
    },
    primaryButtonText: {
      type: String,
      default: "Get Started"
    },
    primaryButtonLink: {
      type: String,
      default: "/contact"
    },
    secondaryButtonText: {
      type: String,
      default: "Learn More"
    },
    secondaryButtonLink: {
      type: String,
      default: "/about"
    },
    showButtons: {
      type: Boolean,
      default: true
    },
    alignment: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'center'
    },
    height: {
      type: String,
      enum: ['small', 'medium', 'large', 'full'],
      default: 'large'
    },
    animationType: {
      type: String,
      enum: ['fade', 'slide', 'zoom', 'none'],
      default: 'fade'
    },
    fontSize: {
      title: { type: String, default: 'large' },
      subtitle: { type: String, default: 'medium' },
      description: { type: String, default: 'medium' },
      badge: { type: String, default: 'medium' }
    },
    colorScheme: {
      type: String,
      default: 'dark'
    },
    customColors: {
      title: { type: String, default: 'text-white' },
      subtitle: { type: String, default: 'text-cyan-400' },
      description: { type: String, default: 'text-gray-300' }
    },
    useCustomColors: {
      type: Boolean,
      default: false
    },
    badgeStyle: {
      type: String,
      default: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
    },
    sliderSettings: {
      autoplay: { type: Boolean, default: true },
      autoplaySpeed: { type: Number, default: 5000 },
      dots: { type: Boolean, default: true },
      arrows: { type: Boolean, default: true },
      infinite: { type: Boolean, default: true },
      fade: { type: Boolean, default: false }
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

// ⚠️ PRE-SAVE MIDDLEWARE COMPLETELY HATAYA - error na aave
// heroSchema.pre('save', ...) - KOI MIDDLEWARE NAHI

module.exports = mongoose.model("Hero", heroSchema);