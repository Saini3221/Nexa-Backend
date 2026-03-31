const mongoose = require('mongoose');
require('dotenv').config();
const Blog = require('./models/Blog');

async function checkBlogs() {
  await mongoose.connect(process.env.MONGO_URI);
  const blogs = await Blog.find().sort({ updatedAt: -1 }).limit(5);
  console.log(JSON.stringify(blogs.map(b => ({ id: b._id, title: b.title, slug: b.slug })), null, 2));
  await mongoose.connection.close();
}

checkBlogs();
