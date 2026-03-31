const Service = require("../models/Service");
const slugify = require("slugify");
const cloudinary = require("../config/cloudinary"); // ✅ Import cloudinary

// Helper function to clean slug but preserve slashes
const cleanSlug = (slug) => {
  if (!slug) return slug;

  return slug
    .toLowerCase()
    .replace(/[^a-z0-9\/-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^-+|-+$/g, '')
    .replace(/^\/+|\/+$/g, '');
};

// Helper function to upload image to Cloudinary
const uploadImageToCloudinary = async (file) => {
  try {
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'services', // Different folder from blogs
      resource_type: 'auto'
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// 🔥 ADD SERVICE
exports.addService = async (req, res) => {
  try {
    const {
      pageTitle,
      miniDescription,
      buttonText,
      slug,
      heroHeading,
      heroParagraphs,
      heroImageAlt
    } = req.body;

    // Validation - sirf pageTitle required hai
    if (!pageTitle) {
      return res.status(400).json({
        success: false,
        error: "Page Title is Required"
      });
    }

    // Generate slug
    let finalSlug;
    if (slug) {
      finalSlug = cleanSlug(slug);
    } else {
      finalSlug = slugify(pageTitle, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g
      });
    }

    // Check if service already exists
    const existing = await Service.findOne({ slug: finalSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Service with this slug already exists"
      });
    }

    // Upload image to Cloudinary if file exists or use the uploaded URL
    let heroImage = "";
    if (req.file) {
      heroImage = await uploadImageToCloudinary(req.file);
    } else if (req.body.heroImage) {
      heroImage = req.body.heroImage;
    }

    // Parse heroHeading if it's a string
    let parsedHeroHeading = heroHeading;
    if (typeof heroHeading === 'string' && heroHeading) {
      try {
        parsedHeroHeading = JSON.parse(heroHeading);
      } catch (e) {
        parsedHeroHeading = {
          text: heroHeading,
          type: "h1",
          color: "#ffffff",
          fontSize: "48px",
          fontWeight: "bold",
          alignment: "left"
        };
      }
    }

    // Parse heroParagraphs if it's a string
    let parsedHeroParagraphs = heroParagraphs;
    if (typeof heroParagraphs === 'string' && heroParagraphs) {
      try {
        parsedHeroParagraphs = JSON.parse(heroParagraphs);
      } catch (e) {
        parsedHeroParagraphs = [{
          text: heroParagraphs,
          color: "#d1d5db",
          fontSize: "18px",
          fontWeight: "normal",
          fontStyle: "normal",
          textDecoration: "none"
        }];
      }
    }

    // Create new service with all fields
    const newService = new Service({
      pageTitle,
      miniDescription: miniDescription || "",
      buttonText: buttonText || "",
      slug: finalSlug,
      heroHeading: parsedHeroHeading || {
        text: "",
        type: "h1",
        color: "#ffffff",
        fontSize: "48px",
        fontWeight: "bold",
        alignment: "left"
      },
      heroParagraphs: parsedHeroParagraphs || [{
        text: "",
        color: "#d1d5db",
        fontSize: "18px",
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none"
      }],
      heroImage: heroImage || "",
      heroImageAlt: heroImageAlt || ""
    });

    await newService.save();

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: newService
    });

  } catch (error) {
    console.error("Error in addService:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// 🔥 GET ALL SERVICES
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find()
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error("Error in getAllServices:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// 🔥 GET SERVICE BY SLUG
exports.getServiceBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const service = await Service.findOne({ slug });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error("Error in getServiceBySlug:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// 🔥 GET SERVICE BY ID
exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error("Error in getServiceById:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// 🔥 UPDATE SERVICE
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      pageTitle,
      miniDescription,
      buttonText,
      slug,
      heroHeading,
      heroParagraphs,
      heroImageAlt
    } = req.body;

    const updateData = {};

    // Basic fields
    if (pageTitle) updateData.pageTitle = pageTitle;
    if (miniDescription !== undefined) updateData.miniDescription = miniDescription;
    if (buttonText !== undefined) updateData.buttonText = buttonText;

    // Handle slug update
    if (slug) {
      updateData.slug = cleanSlug(slug);
    } else if (pageTitle && !slug) {
      updateData.slug = slugify(pageTitle, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g
      });
    }

    // Upload new image to Cloudinary if file exists or use the uploaded URL
    if (req.file) {
      updateData.heroImage = await uploadImageToCloudinary(req.file);
    } else if (req.body.heroImage !== undefined) {
      updateData.heroImage = req.body.heroImage;
    }

    // Handle heroHeading
    if (heroHeading !== undefined) {
      if (typeof heroHeading === 'string' && heroHeading) {
        try {
          updateData.heroHeading = JSON.parse(heroHeading);
        } catch (e) {
          updateData.heroHeading = { text: heroHeading };
        }
      } else if (heroHeading) {
        updateData.heroHeading = heroHeading;
      }
    }

    // Handle heroParagraphs
    if (heroParagraphs !== undefined) {
      if (typeof heroParagraphs === 'string' && heroParagraphs) {
        try {
          updateData.heroParagraphs = JSON.parse(heroParagraphs);
        } catch (e) {
          updateData.heroParagraphs = [{ text: heroParagraphs }];
        }
      } else if (heroParagraphs) {
        updateData.heroParagraphs = heroParagraphs;
      }
    }

    if (heroImageAlt !== undefined) updateData.heroImageAlt = heroImageAlt;

    // Check if new slug already exists
    if (updateData.slug) {
      const existing = await Service.findOne({
        slug: updateData.slug,
        _id: { $ne: id }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: "Service with this slug already exists"
        });
      }
    }

    const updated = await Service.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    res.json({
      success: true,
      message: "Service updated successfully",
      data: updated
    });
  } catch (error) {
    console.error("Error in updateService:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// 🔥 DELETE SERVICE
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Service.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    // Optional: Delete image from Cloudinary
    if (deleted.heroImage) {
      try {
        const publicId = deleted.heroImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`services/${publicId}`);
      } catch (cloudinaryError) {
        console.error('Cloudinary delete error:', cloudinaryError);
      }
    }

    res.json({
      success: true,
      message: "Service deleted successfully",
      data: {
        id: deleted._id,
        pageTitle: deleted.pageTitle
      }
    });
  } catch (error) {
    console.error("Error in deleteService:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// 🔥 BULK DELETE SERVICES
exports.deleteMultipleServices = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Please provide an array of service IDs"
      });
    }

    const result = await Service.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `${result.deletedCount} services deleted successfully`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error("Error in deleteMultipleServices:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// 🔥 SEPARATE IMAGE UPLOAD (optional)
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const imageUrl = await uploadImageToCloudinary(req.file);

    res.json({
      success: true,
      data: {
        url: imageUrl
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};