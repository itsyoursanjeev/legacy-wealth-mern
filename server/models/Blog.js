const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    maxlength: 160
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    maxlength: 300
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  coverImage: { type: String, default: '' },
  category: {
    type: String,
    enum: ['Market Structure', 'Risk Management', 'Psychology', 'Investing', 'News', 'General'],
    default: 'General'
  },
  author: { type: String, default: 'Sanjeev Sharma' },
  readTime: { type: Number, default: 5, min: 1 },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  views: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
