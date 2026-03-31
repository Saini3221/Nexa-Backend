const Blog = require("../models/Blog");
const slugify = require("slugify");
const cloudinary = require("../config/cloudinary");

// Helper function to clean slug
const cleanSlug = (slug) => {
  if (!slug) return slug;
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Create Blog
exports.createBlog = async (req, res) => {
  try {
    const { title, slug, sections, author, views, category, image } = req.body;
    let imageUrl = image;

    // Agar file upload hui hai (featured image)
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'blogs',
        resource_type: 'auto'
      });
      imageUrl = result.secure_url;
    }

    // Slug generation
    let finalSlug;
    if (slug) {
      finalSlug = cleanSlug(slug);
    } else if (title) {
      finalSlug = slugify(title, { lower: true, strict: true });
    }

    // Validation
    if (!title || !finalSlug || !imageUrl || !sections || (typeof sections === 'string' ? JSON.parse(sections).length === 0 : sections.length === 0)) {
      return res.status(400).json({ 
        message: "Title, Slug, Featured Image, and at least one section are required" 
      });
    }

    // Check for duplicate slug
    const existing = await Blog.findOne({ slug: finalSlug });
    if (existing) {
      return res.status(400).json({ message: "Slug matching this title or manual entry already exists." });
    }

    let parsedSections = sections;
    if (typeof sections === 'string') {
        try {
            parsedSections = JSON.parse(sections);
        } catch (e) {
            return res.status(400).json({ message: "Invalid sections format" });
        }
    }

    const newBlog = new Blog({
      title,
      slug: finalSlug,
      sections: parsedSections,
      image: imageUrl,
      author: author || "Admin",
      views: views || 0,
      category: category || "City Guide"
    });

    await newBlog.save();

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: newBlog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Slug must be unique. This URL is already taken." });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get All Blogs
exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Blog By ID
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Blog By Slug (with Smart ID Fallback)
exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // 1. Try to find by slug first
    let blog = await Blog.findOne({ slug });
    
    // 2. If not found by slug, check if it could be a MongoDB ID
    if (!blog && mongoose.Types.ObjectId.isValid(slug)) {
      blog = await Blog.findById(slug);
    }
    
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Blog
exports.updateBlog = async (req, res) => {
  try {
    const { title, slug, sections, author, views, category, image } = req.body;
    let imageUrl = image;

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'blogs',
        resource_type: 'auto'
      });
      imageUrl = result.secure_url;
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (author) updateData.author = author;
    if (category) updateData.category = category;
    if (views !== undefined) updateData.views = Number(views);
    if (imageUrl) updateData.image = imageUrl;

    // Handle slug update
    if (slug) {
      updateData.slug = cleanSlug(slug);
    } else if (title) {
      // Auto-generate slug from title ONLY if title is updated and no slug is provided
      updateData.slug = slugify(title, { lower: true, strict: true });
    }

    if (sections) {
      let parsedSections = sections;
      if (typeof sections === "string") {
        try {
          parsedSections = JSON.parse(sections);
        } catch (e) {
          return res.status(400).json({ message: "Invalid sections format" });
        }
      }
      updateData.sections = parsedSections;
    }

    // Check if new slug already exists
    if (updateData.slug) {
      const existing = await Blog.findOne({
        slug: updateData.slug,
        _id: { $ne: req.params.id }
      });

      if (existing) {
        return res.status(400).json({
          message: "Slug must be unique. This URL is already taken."
        });
      }
    }

    const updated = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Blog updated successfully",
      data: updated
    });
  } catch (error) {
    console.error('Update error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Slug must be unique. This URL is already taken." });
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete Blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    // Delete image from Cloudinary (optional)
    if (blog && blog.image) {
      try {
        // Extract public ID from URL
        const parts = blog.image.split('/');
        const fileName = parts.pop();
        const publicId = fileName.split('.')[0];
        await cloudinary.uploader.destroy(`blogs/${publicId}`);
      } catch (cloudinaryError) {
        console.error('Cloudinary delete error:', cloudinaryError);
      }
    }

    await Blog.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true,
      message: "Blog Deleted Successfully" 
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Upload image only (separate route)
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'blogs',
      resource_type: 'auto'
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id
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