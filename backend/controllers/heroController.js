const Hero = require("../models/Hero");
const cloudinary = require("../config/cloudinary");

// ========== GET ALL HEROES (ADMIN) ==========
exports.getAllHeroes = async (req, res) => {
  try {
    const heroes = await Hero.find().sort({ pageId: 1, order: 1 });
    
    const grouped = {};
    heroes.forEach(hero => {
      if (!grouped[hero.pageId]) {
        grouped[hero.pageId] = [];
      }
      grouped[hero.pageId].push(hero);
    });
    
    res.json({
      success: true,
      data: heroes,
      grouped
    });
  } catch (error) {
    console.error('Get all heroes error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== GET HEROES BY PAGE (FRONTEND) ==========
exports.getHeroesByPage = async (req, res) => {
  try {
    const { pageId } = req.params;
    
    const heroes = await Hero.find({ 
      pageId, 
      isActive: true 
    }).sort({ order: 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: heroes
    });
  } catch (error) {
    console.error('Get heroes by page error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== GET SINGLE HERO ==========
exports.getHeroById = async (req, res) => {
  try {
    const hero = await Hero.findById(req.params.id);
    
    if (!hero) {
      return res.status(404).json({ 
        success: false, 
        message: "Hero not found" 
      });
    }
    
    res.json({
      success: true,
      data: hero
    });
  } catch (error) {
    console.error('Get hero by id error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== CREATE NEW HERO (FIXED) ==========
exports.createHero = async (req, res) => {
  try {
    const { pageId, pageName, heroName } = req.body;
    
    if (!pageId) {
      return res.status(400).json({
        success: false,
        message: "pageId is required"
      });
    }
    
    const lastHero = await Hero.findOne({ pageId }).sort({ order: -1 });
    const newOrder = lastHero ? lastHero.order + 1 : 0;
    
    const heroData = {
      pageId,
      pageName: pageName || pageId.charAt(0).toUpperCase() + pageId.slice(1),
      heroName: heroName || `New ${pageName || pageId} Hero`,
      title: "New Hero Section",
      subtitle: "Add your subtitle here",
      description: "Add your description here",
      images: [],
      order: newOrder
    };
    
    const newHero = new Hero(heroData);
    await newHero.save();
    
    res.status(201).json({
      success: true,
      message: "New hero created successfully",
      data: newHero
    });
  } catch (error) {
    console.error('Create hero error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== UPDATE HERO ==========
exports.updateHero = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    updateData.updatedAt = Date.now();
    
    const hero = await Hero.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!hero) {
      return res.status(404).json({ 
        success: false, 
        message: "Hero not found" 
      });
    }
    
    res.json({
      success: true,
      message: "Hero updated successfully",
      data: hero
    });
  } catch (error) {
    console.error('Update hero error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== UPLOAD MULTIPLE IMAGES ==========
exports.uploadHeroImages = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files uploaded' 
      });
    }

    const hero = await Hero.findById(id);
    if (!hero) {
      return res.status(404).json({ 
        success: false, 
        message: "Hero not found" 
      });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: `heroes/${id}`,
        resource_type: 'auto'
      });

      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
        alt: file.originalname,
        order: hero.images.length + uploadedImages.length
      });
    }

    hero.images = [...hero.images, ...uploadedImages];
    hero.images.sort((a, b) => a.order - b.order);
    
    if (hero.images.length > 0) {
      hero.backgroundImage = hero.images[0].url;
    }
    
    await hero.save();

    res.json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: hero
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== DELETE SINGLE IMAGE ==========
exports.deleteHeroImage = async (req, res) => {
  try {
    const { heroId, imageId } = req.params;
    
    const hero = await Hero.findById(heroId);
    if (!hero) {
      return res.status(404).json({ 
        success: false, 
        message: "Hero not found" 
      });
    }

    const imageIndex = hero.images.findIndex(img => img._id.toString() === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: "Image not found" 
      });
    }

    const image = hero.images[imageIndex];

    if (image.publicId) {
      try {
        await cloudinary.uploader.destroy(image.publicId);
      } catch (e) {
        console.error('Cloudinary delete error:', e);
      }
    }

    hero.images.splice(imageIndex, 1);
    
    hero.images.forEach((img, idx) => {
      img.order = idx;
    });

    if (hero.images.length > 0) {
      hero.backgroundImage = hero.images[0].url;
    } else {
      hero.backgroundImage = '';
    }

    await hero.save();

    res.json({
      success: true,
      message: "Image deleted successfully",
      data: hero
    });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== REORDER IMAGES ==========
exports.reorderImages = async (req, res) => {
  try {
    const { heroId } = req.params;
    const { images } = req.body;

    const hero = await Hero.findById(heroId);
    if (!hero) {
      return res.status(404).json({ 
        success: false, 
        message: "Hero not found" 
      });
    }

    images.forEach(({ _id, order }) => {
      const img = hero.images.id(_id);
      if (img) {
        img.order = order;
      }
    });

    hero.images.sort((a, b) => a.order - b.order);
    
    if (hero.images.length > 0) {
      hero.backgroundImage = hero.images[0].url;
    }
    
    await hero.save();

    res.json({
      success: true,
      message: "Images reordered successfully",
      data: hero.images
    });

  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== DUPLICATE HERO ==========
exports.duplicateHero = async (req, res) => {
  try {
    const { id } = req.params;
    
    const originalHero = await Hero.findById(id);
    if (!originalHero) {
      return res.status(404).json({ 
        success: false, 
        message: "Hero not found" 
      });
    }

    const lastHero = await Hero.findOne({ pageId: originalHero.pageId })
      .sort({ order: -1 });
    
    const heroData = originalHero.toObject();
    delete heroData._id;
    delete heroData.createdAt;
    delete heroData.updatedAt;
    
    heroData.heroName = `${originalHero.heroName} (Copy)`;
    heroData.order = lastHero ? lastHero.order + 1 : 0;
    heroData.isActive = false;
    
    heroData.images = originalHero.images.map(img => ({
      url: img.url,
      publicId: img.publicId,
      alt: img.alt,
      order: img.order
    }));

    const newHero = new Hero(heroData);
    await newHero.save();

    res.json({
      success: true,
      message: "Hero duplicated successfully",
      data: newHero
    });

  } catch (error) {
    console.error('Duplicate error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== TOGGLE HERO STATUS ==========
exports.toggleHeroStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const hero = await Hero.findById(id);
    if (!hero) {
      return res.status(404).json({ 
        success: false, 
        message: "Hero not found" 
      });
    }
    
    hero.isActive = !hero.isActive;
    await hero.save();
    
    res.json({
      success: true,
      message: `Hero ${hero.isActive ? 'activated' : 'deactivated'}`,
      data: hero
    });
  } catch (error) {
    console.error('Toggle error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ========== DELETE HERO ==========
exports.deleteHero = async (req, res) => {
  try {
    const { id } = req.params;
    
    const hero = await Hero.findById(id);
    if (!hero) {
      return res.status(404).json({ 
        success: false, 
        message: "Hero not found" 
      });
    }

    if (hero.images && hero.images.length > 0) {
      for (const image of hero.images) {
        if (image.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
          } catch (e) {
            console.error('Failed to delete image:', image.publicId);
          }
        }
      }
    }

    await Hero.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: "Hero deleted successfully"
    });
  } catch (error) {
    console.error('Delete hero error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};