const express = require('express');
const asyncHandler = require('express-async-handler');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

const router = express.Router();

// GET /api/courses  (public — published only)
router.get('/', asyncHandler(async (req, res) => {
  const { category, level, search } = req.query;
  const filter = { isPublished: true };
  if (category) filter.category = category;
  if (level) filter.level = level;
  if (search) filter.title = { $regex: search, $options: 'i' };
  const courses = await Course.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: courses.length, courses });
}));

// GET /api/courses/admin/all  (admin)
router.get('/admin/all', protect, admin, asyncHandler(async (req, res) => {
  const courses = await Course.find().sort({ createdAt: -1 });
  res.json({ success: true, count: courses.length, courses });
}));

// GET /api/courses/admin/:id  (admin — single course by MongoDB ID)
router.get('/admin/:id', protect, admin, asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) { res.status(404); throw new Error('Course not found'); }
  res.json({ success: true, course });
}));

// GET /api/courses/:slug/learn  (protected — active enrollment required)
router.get('/:slug/learn', protect, asyncHandler(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug });
  if (!course) { res.status(404); throw new Error('Course not found'); }

  // Admins bypass enrollment check
  if (req.user.role !== 'admin') {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: course._id,
      enrollmentStatus: 'active'
    });
    if (!enrollment) { res.status(403); throw new Error('Active enrollment required to access this course'); }
  }

  // Fetch all lessons grouped by module
  const lessons = await Lesson.find({ course: course._id }).sort({ order: 1 });

  const modulesWithLessons = course.modules.map(mod => ({
    _id: mod._id,
    title: mod.title,
    description: mod.description,
    lessons: lessons.filter(l => l.moduleId.toString() === mod._id.toString())
  }));

  res.json({ success: true, course, modules: modulesWithLessons, totalLessons: lessons.length });
}));

// GET /api/courses/:slug  (public)
router.get('/:slug', asyncHandler(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug, isPublished: true });
  if (!course) { res.status(404); throw new Error('Course not found'); }
  res.json({ success: true, course });
}));

// POST /api/courses  (admin)
router.post('/', protect, admin, asyncHandler(async (req, res) => {
  const slug = (req.body.slug || req.body.title || '')
    .toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const course = await Course.create({ ...req.body, slug });
  res.status(201).json({ success: true, course });
}));

// PUT /api/courses/:id  (admin)
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!course) { res.status(404); throw new Error('Course not found'); }
  res.json({ success: true, course });
}));

// DELETE /api/courses/:id  (admin)
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) { res.status(404); throw new Error('Course not found'); }
  await Lesson.deleteMany({ course: req.params.id });
  res.json({ success: true, message: 'Course and its lessons deleted' });
}));

// ── Module management ─────────────────────────────────────────────────────────
// Modules are embedded subdocuments inside Course. CRUD is handled here.

// POST /api/courses/:id/modules  — create a new module
router.post('/:id/modules', protect, admin, asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) { res.status(404); throw new Error('Course not found'); }
  const { title, description } = req.body;
  if (!title?.trim()) { res.status(400); throw new Error('Module title is required'); }
  course.modules.push({ title: title.trim(), description: (description || '').trim() });
  await course.save();
  res.status(201).json({ success: true, course });
}));

// PUT /api/courses/:id/modules/reorder  — reorder modules (MUST be before /:id/modules/:moduleId)
router.put('/:id/modules/reorder', protect, admin, asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) { res.status(404); throw new Error('Course not found'); }
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) { res.status(400); throw new Error('orderedIds must be an array'); }
  const reordered = orderedIds.map(id => course.modules.id(id)).filter(Boolean);
  course.modules = reordered;
  await course.save();
  res.json({ success: true, course });
}));

// PUT /api/courses/:id/modules/:moduleId  — update a module
router.put('/:id/modules/:moduleId', protect, admin, asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) { res.status(404); throw new Error('Course not found'); }
  const mod = course.modules.id(req.params.moduleId);
  if (!mod) { res.status(404); throw new Error('Module not found'); }
  const { title, description } = req.body;
  if (title !== undefined) mod.title = title.trim();
  if (description !== undefined) mod.description = description.trim();
  await course.save();
  res.json({ success: true, course });
}));

// DELETE /api/courses/:id/modules/:moduleId  — delete module and cascade its lessons
router.delete('/:id/modules/:moduleId', protect, admin, asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) { res.status(404); throw new Error('Course not found'); }
  const mod = course.modules.id(req.params.moduleId);
  if (!mod) { res.status(404); throw new Error('Module not found'); }
  const moduleId = req.params.moduleId;
  course.modules.pull(moduleId);
  await course.save();
  await Lesson.deleteMany({ course: course._id, moduleId });
  res.json({ success: true, message: 'Module and its lessons deleted', course });
}));

module.exports = router;
