const express = require('express');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const Lead = require('../models/Lead');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

const router = express.Router();

// ── Public: capture lead ──────────────────────────────────────────────────────
router.post('/', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map(e => e.msg).join(', '));
  }

  const {
    firstName = '', lastName = '', name,
    email, phone, city = '', age = '',
    tradingExperience = '', plannedCapital = '',
    preferredContactTime = '', interestedCourse = 'General',
    source = 'Website', sourcePage = '/', interest = 'General',
    message = ''
  } = req.body;

  // Build display name from firstName/lastName or fall back to provided name
  const displayName = (firstName || lastName)
    ? `${firstName} ${lastName}`.trim()
    : (name || '').trim();

  if (!displayName) {
    res.status(400);
    throw new Error('Name is required');
  }

  const lead = await Lead.create({
    name: displayName,
    firstName, lastName,
    email, phone, city, age,
    tradingExperience, plannedCapital, preferredContactTime,
    interestedCourse, source, sourcePage, interest, message
  });

  res.status(201).json({
    success: true,
    message: "Thanks! We'll reach out within 24 hours.",
    leadId: lead._id
  });
}));

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.use(protect, admin);

// GET /api/leads — list with filter + search
router.get('/', asyncHandler(async (req, res) => {
  const { status, source, search } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (source && source !== 'all') filter.source = source;

  let leads = await Lead.find(filter).sort({ createdAt: -1 });

  if (search) {
    const q = search.toLowerCase();
    leads = leads.filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.firstName?.toLowerCase().includes(q) ||
      l.lastName?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.interestedCourse?.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: leads.length, leads });
}));

// PUT /api/leads/:id — update status, notes, any field
router.put('/:id', asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!lead) { res.status(404); throw new Error('Lead not found'); }
  res.json({ success: true, lead });
}));

// DELETE /api/leads/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) { res.status(404); throw new Error('Lead not found'); }
  res.json({ success: true, message: 'Lead deleted' });
}));

module.exports = router;