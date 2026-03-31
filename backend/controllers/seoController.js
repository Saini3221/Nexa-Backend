const Seo = require("../models/Seo");
const Service = require("../models/Service");

// Get all SEO entries
exports.getAllSeo = async (req, res) => {
  try {
    const seos = await Seo.find().sort({ updatedAt: -1 });
    res.json(seos);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get SEO by URL
exports.getSeoByUrl = async (req, res) => {
  try {
    let url = decodeURIComponent(req.params.url);
    if (!url.startsWith("/")) url = "/" + url;

    // Search for exact path OR a record that ends with this path (to handle full URL mistakes)
    let seo = await Seo.findOne({ 
      $or: [
        { pageUrl: url },
        { pageUrl: { $regex: new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$") } }
      ]
    });
    
    if (!seo) {
      return res.status(404).json({ message: "SEO data not found" });
    }
    
    res.json(seo);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Create new SEO entry
exports.createSeo = async (req, res) => {
  let { pageUrl, metaTitle, metaDescription, metaKeywords, canonicalUrl, robotsTag } = req.body;

  // Clean the URL: only store the pathname
  try {
    if (pageUrl.startsWith("http")) {
      pageUrl = new URL(pageUrl).pathname;
    }
    if (!pageUrl.startsWith("/")) {
      pageUrl = "/" + pageUrl;
    }
  } catch (e) {
    // Keep original if parsing fails
  }

  try {
    const creatorEmail = req.session.seoUser?.email || req.session.admin?.email || "Unknown";
    const newSeo = new Seo({
      pageUrl,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      robotsTag,
      createdBy: creatorEmail,
      updatedBy: creatorEmail
    });

    const savedSeo = await newSeo.save();
    res.status(201).json(savedSeo);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "SEO entry already exists for this URL" });
    }
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update SEO entry
exports.updateSeo = async (req, res) => {
  try {
    const updaterEmail = req.session.seoUser?.email || req.session.admin?.email || "Unknown";
    let updateData = { ...req.body, updatedBy: updaterEmail, updatedAt: Date.now() };

    // Clean the URL if it's being updated
    if (updateData.pageUrl) {
      try {
        if (updateData.pageUrl.startsWith("http")) {
          updateData.pageUrl = new URL(updateData.pageUrl).pathname;
        }
        if (!updateData.pageUrl.startsWith("/")) {
          updateData.pageUrl = "/" + updateData.pageUrl;
        }
      } catch (e) {}
    }

    const updatedSeo = await Seo.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedSeo) {
      return res.status(404).json({ message: "SEO entry not found" });
    }

    res.json(updatedSeo);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete SEO entry
exports.deleteSeo = async (req, res) => {
  try {
    const seo = await Seo.findByIdAndDelete(req.params.id);

    if (!seo) {
      return res.status(404).json({ message: "SEO entry not found" });
    }

    res.json({ message: "SEO entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
// Auto Update SEO from H1
exports.autoUpdateSeo = async (req, res) => {
  let { pageUrl, metaTitle } = req.body;

  if (!pageUrl || !metaTitle) {
    return res.status(400).json({ message: "pageUrl and metaTitle are required" });
  }

  // Clean the URL
  try {
    if (pageUrl.startsWith("http")) {
      pageUrl = new URL(pageUrl).pathname;
    }
    if (!pageUrl.startsWith("/")) {
      pageUrl = "/" + pageUrl;
    }
  } catch (e) {}

  try {
    // Check if SEO record already exists
    let seo = await Seo.findOne({ pageUrl });

    const systemUser = "System (Auto SEO)";

    if (seo) {
      // If metaTitle is empty or explicitly different from H1 (and user wants to sync)
      // For now, let's only update if it's explicitly "Automatic Title" or empty
      // but the user's request "auto seo ho ja jo bhi page ch h1 hai o seo k title ch ja k store ho ja"
      // suggests they want it to store/sync. 
      // I'll update it if metaTitle is different and was previously generic or empty.
      if (!seo.metaTitle || seo.metaTitle === "Automatic Title") {
        seo.metaTitle = metaTitle;
        seo.updatedBy = systemUser;
        seo.updatedAt = Date.now();
        await seo.save();
        return res.json({ message: "SEO Title updated from H1", seo });
      }
      return res.json({ message: "SEO record already exists, skipping update", seo });
    } else {
      // Create new SEO record
      const newSeo = new Seo({
        pageUrl,
        metaTitle,
        metaDescription: `SEO description for ${metaTitle}. Please update this in Admin Panel.`,
        metaKeywords: "",
        canonicalUrl: pageUrl,
        robotsTag: "index, follow",
        createdBy: systemUser,
        updatedBy: systemUser
      });

      const savedSeo = await newSeo.save();
      res.status(201).json({ message: "New SEO record created from H1", seo: savedSeo });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
// Bulk Auto Update SEO for Services
exports.bulkAutoUpdateServices = async (req, res) => {
  try {
    const services = await Service.find();
    if (!services || services.length === 0) {
      return res.status(404).json({ message: "No services found to update" });
    }

    const systemUser = "System (Auto SEO Services)";
    let createdCount = 0;
    let updatedCount = 0;

    for (const service of services) {
      let url = service.slug;
      if (!url.startsWith("/")) url = "/" + url;

      // Check if SEO record exists
      let seo = await Seo.findOne({ pageUrl: url });

      if (seo) {
        // Update if title is generic or empty
        if (!seo.metaTitle || seo.metaTitle === "Automatic Title") {
          seo.metaTitle = service.pageTitle;
          seo.metaDescription = seo.metaDescription || service.miniDescription || `SEO description for ${service.pageTitle}`;
          seo.updatedBy = systemUser;
          seo.updatedAt = Date.now();
          await seo.save();
          updatedCount++;
        }
      } else {
        // Create new
        const newSeo = new Seo({
          pageUrl: url,
          metaTitle: service.pageTitle,
          metaDescription: service.miniDescription || `SEO description for ${service.pageTitle}`,
          metaKeywords: "",
          canonicalUrl: url,
          robotsTag: "index, follow",
          createdBy: systemUser,
          updatedBy: systemUser
        });
        await newSeo.save();
        createdCount++;
      }
    }

    res.json({ 
      success: true, 
      message: `Bulk update completed: ${createdCount} created, ${updatedCount} updated`,
      stats: { createdCount, updatedCount }
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error during bulk update", error: error.message });
  }
};
