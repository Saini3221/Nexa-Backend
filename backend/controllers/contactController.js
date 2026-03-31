// controllers/contactController.js
const Contact = require("../models/Contact");
const { sendAdminEmail } = require("../config/emailConfig");

/* CREATE CONTACT */
const createContact = async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    console.log('📝 Received contact form submission:', { name, email, phone });

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "❌ Name, email and message are required"
      });
    }

    // Email format validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "❌ Invalid email address"
      });
    }

    // 1. Database mein save karo
    const newMessage = new Contact({
      name: name.trim(),
      phone: phone?.trim() || '',
      email: email.trim().toLowerCase(),
      message: message.trim(),
    });

    await newMessage.save();
    console.log('✅ Contact saved to database. ID:', newMessage._id);

    // 2. Email bhejo admin ko (background mein)
    console.log('📬 Attempting to send admin email...');
    console.log('🔑 RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);

    if (process.env.RESEND_API_KEY) {
      // Don't await - let it run in background
      sendAdminEmail({ name, phone, email, message })
        .then(result => {
          if (result.success) {
            console.log(`✅ Admin email sent for contact ${newMessage._id}. Message ID: ${result.messageId}`);
          } else {
            console.log(`⚠️ Admin email failed for contact ${newMessage._id}:`, result.error);
            console.log('💡 Note: onboarding@resend.dev requires ADMIN_EMAIL to match your Resend account email.');
          }
        })
        .catch(err => {
          console.error(`❌ Email error for contact ${newMessage._id}:`, err);
        });
    } else {
      console.log('⚠️ Skipping email: RESEND_API_KEY is missing in .env');
    }

    // 3. Success response
    res.status(201).json({
      success: true,
      message: "✅ Message Sent Successfully!",
      data: {
        id: newMessage._id,
        name: newMessage.name,
        email: newMessage.email,
        phone: newMessage.phone,
        message: newMessage.message,
        createdAt: newMessage.createdAt
      },
    });
    
  } catch (error) {
    console.error('❌ Create contact error:', error);
    
    res.status(500).json({
      success: false,
      message: "❌ Server error. Something went wrong.",
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

/* GET ALL CONTACTS */
const getContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Contact.countDocuments();

    res.status(200).json({
      success: true,
      count: contacts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: contacts,
    });
  } catch (error) {
    console.error('❌ Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* DELETE CONTACT */
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "❌ Contact Not Found",
      });
    }

    await contact.deleteOne();
    console.log(`🗑️ Contact deleted: ${req.params.id}`);

    res.status(200).json({
      success: true,
      message: "✅ Contact Deleted Successfully",
    });
  } catch (error) {
    console.error('❌ Delete contact error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: "❌ Invalid contact ID format"
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* MARK AS READ */
const markAsRead = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "❌ Contact Not Found",
      });
    }

    if (contact.isRead) {
      return res.status(200).json({
        success: true,
        message: "Contact already marked as read",
        data: contact,
      });
    }

    contact.isRead = true;
    await contact.save();
    console.log(`✅ Contact marked as read: ${req.params.id}`);

    res.status(200).json({
      success: true,
      message: "✅ Marked as Read",
      data: contact,
    });
  } catch (error) {
    console.error('❌ Mark as read error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: "❌ Invalid contact ID format"
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* GET SINGLE CONTACT */
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "❌ Contact Not Found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error('❌ Get contact by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: "❌ Invalid contact ID format"
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createContact,
  getContacts,
  deleteContact,
  markAsRead,
  getContactById,
};