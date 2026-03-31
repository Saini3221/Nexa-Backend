const Blog = require("../models/Blog");
const cloudinary = require("../config/cloudinary");

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

    // Validation
    if (!title || !slug || !imageUrl || !sections || sections.length === 0) {
      return res.status(400).json({ 
        message: "Title, Slug, Featured Image, and at least one section are required" 
      });
    }

    const newBlog = new Blog({
      title,
      slug,
      sections,
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

    const updateData = {
      title,
      slug,
      sections,
      author: author || "Admin",
      views: views || 0,
      category: category || "City Guide",
      image: imageUrl
    };

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
        const publicId = blog.image.split('/').pop().split('.')[0];
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