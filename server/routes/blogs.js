const express = require('express');
const asyncHandler = require('express-async-handler');
const Blog = require('../models/Blog');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

const router = express.Router();

// GET /api/blogs  (public — published only)
router.get('/', asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const filter = { isPublished: true };
  if (category) filter.category = category;
  if (search) filter.title = { $regex: search, $options: 'i' };
  const blogs = await Blog.find(filter).sort({ publishedAt: -1 }).select('-content');
  res.json({ success: true, count: blogs.length, blogs });
}));

// GET /api/blogs/admin/all  (admin — includes drafts)
router.get('/admin/all', protect, admin, asyncHandler(async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json({ success: true, count: blogs.length, blogs });
}));

// GET /api/blogs/admin/:id  (admin — single by MongoDB ID, for edit form)
router.get('/admin/:id', protect, admin, asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) { res.status(404); throw new Error('Blog not found'); }
  res.json({ success: true, blog });
}));

// GET /api/blogs/:slug  (public — published only)
router.get('/:slug', asyncHandler(async (req, res) => {
  const blog = await Blog.findOneAndUpdate(
    { slug: req.params.slug, isPublished: true },
    { $inc: { views: 1 } },
    { new: true }
  );
  if (!blog) { res.status(404); throw new Error('Blog not found'); }
  res.json({ success: true, blog });
}));

// POST /api/blogs  (admin)
router.post('/', protect, admin, asyncHandler(async (req, res) => {
  const slug = (req.body.slug || req.body.title || '')
    .toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const isPublished = !!req.body.isPublished;
  const blog = await Blog.create({
    ...req.body,
    slug,
    isPublished,
    publishedAt: isPublished ? new Date() : undefined
  });
  res.status(201).json({ success: true, blog });
}));

// PUT /api/blogs/:id  (admin)
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) { res.status(404); throw new Error('Blog not found'); }

  const wasPublished = blog.isPublished;
  Object.assign(blog, req.body);
  if (!wasPublished && blog.isPublished) blog.publishedAt = new Date();

  await blog.save();
  res.json({ success: true, blog });
}));

// DELETE /api/blogs/:id  (admin)
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) { res.status(404); throw new Error('Blog not found'); }
  res.json({ success: true, message: 'Blog deleted' });
}));

module.exports = router;
