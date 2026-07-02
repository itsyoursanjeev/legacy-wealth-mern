const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Lead = require('../models/Lead');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

const router = express.Router();
router.use(protect, admin);

// ─── STATS ────────────────────────────────────────────────────────────────────
router.get('/stats', asyncHandler(async (req, res) => {
  const [users, courses, leads, totalEnrollments, pendingEnrollments, activeEnrollments] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Course.countDocuments(),
    Lead.countDocuments(),
    Enrollment.countDocuments(),
    Enrollment.countDocuments({ enrollmentStatus: 'pending' }),
    Enrollment.countDocuments({ enrollmentStatus: 'active' })
  ]);

  const recentEnrollments = await Enrollment.find()
    .populate('user', 'name email')
    .populate('course', 'title')
    .sort({ createdAt: -1 })
    .limit(5);

  const revenueAgg = await Enrollment.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amountPaid' } } }
  ]);
  const revenue = revenueAgg[0]?.total || 0;
  const newLeads = await Lead.countDocuments({ status: 'new' });

  res.json({ success: true, stats: { users, courses, leads, newLeads, revenue, totalEnrollments, pendingEnrollments, activeEnrollments, recentEnrollments } });
}));

// ─── ENROLLMENTS ──────────────────────────────────────────────────────────────
router.get('/enrollments', asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.enrollmentStatus = status;

  let enrollments = await Enrollment.find(filter)
    .populate('user', 'name email phone')
    .populate('course', 'title category price discountPrice')
    .populate('approvedBy', 'name')
    .sort({ createdAt: -1 });

  if (search) {
    const q = search.toLowerCase();
    enrollments = enrollments.filter(e =>
      e.user?.name?.toLowerCase().includes(q) ||
      e.user?.email?.toLowerCase().includes(q) ||
      e.course?.title?.toLowerCase().includes(q)
    );
  }
  res.json({ success: true, count: enrollments.length, enrollments });
}));

router.patch('/enrollments/:id/approve', asyncHandler(async (req, res) => {
  const e = await Enrollment.findById(req.params.id);
  if (!e) { res.status(404); throw new Error('Enrollment not found'); }
  e.enrollmentStatus = 'active';
  e.approvedBy = req.user._id;
  e.approvedAt = new Date();
  if (req.body.notes) e.adminNotes = req.body.notes;
  await e.save();
  res.json({ success: true, enrollment: e });
}));

router.patch('/enrollments/:id/reject', asyncHandler(async (req, res) => {
  const e = await Enrollment.findById(req.params.id);
  if (!e) { res.status(404); throw new Error('Enrollment not found'); }
  e.enrollmentStatus = 'rejected';
  if (req.body.notes) e.adminNotes = req.body.notes;
  await e.save();
  res.json({ success: true, enrollment: e });
}));

router.patch('/enrollments/:id/payment', asyncHandler(async (req, res) => {
  const e = await Enrollment.findById(req.params.id);
  if (!e) { res.status(404); throw new Error('Enrollment not found'); }
  e.paymentStatus = req.body.paymentStatus || 'paid';
  await e.save();
  res.json({ success: true, enrollment: e });
}));

// ─── LESSONS ──────────────────────────────────────────────────────────────────

// GET /api/admin/lessons?courseId=:id
router.get('/lessons', asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  if (!courseId) { res.status(400); throw new Error('courseId required'); }
  const lessons = await Lesson.find({ course: courseId }).sort({ moduleId: 1, order: 1 });
  res.json({ success: true, count: lessons.length, lessons });
}));

// POST /api/admin/lessons
router.post('/lessons', asyncHandler(async (req, res) => {
  const { courseId, moduleId, title, description, type, videoUrl, duration, order, isPreview, content, resources } = req.body;
  if (!courseId || !moduleId || !title) { res.status(400); throw new Error('courseId, moduleId and title are required'); }

  const lastLesson = await Lesson.findOne({ course: courseId, moduleId }).sort({ order: -1 });
  const nextOrder = order ?? ((lastLesson?.order ?? -1) + 1);

  const lesson = await Lesson.create({ course: courseId, moduleId, title, description, type, videoUrl, duration, order: nextOrder, isPreview, content, resources });
  res.status(201).json({ success: true, lesson });
}));

// PUT /api/admin/lessons/reorder  — bulk update order field (MUST be before /lessons/:id)
router.put('/lessons/reorder', asyncHandler(async (req, res) => {
  const { lessonIds } = req.body;
  if (!Array.isArray(lessonIds)) { res.status(400); throw new Error('lessonIds must be an array'); }
  await Promise.all(lessonIds.map((id, idx) => Lesson.findByIdAndUpdate(id, { order: idx })));
  res.json({ success: true });
}));

// PUT /api/admin/lessons/:id
router.put('/lessons/:id', asyncHandler(async (req, res) => {
  const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!lesson) { res.status(404); throw new Error('Lesson not found'); }
  res.json({ success: true, lesson });
}));

// DELETE /api/admin/lessons/:id
router.delete('/lessons/:id', asyncHandler(async (req, res) => {
  const lesson = await Lesson.findByIdAndDelete(req.params.id);
  if (!lesson) { res.status(404); throw new Error('Lesson not found'); }
  res.json({ success: true, message: 'Lesson deleted' });
}));

// ─── USERS ────────────────────────────────────────────────────────────────────
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, users });
}));

router.put('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (typeof req.body.isActive === 'boolean') user.isActive = req.body.isActive;
  if (req.body.role && ['user', 'admin'].includes(req.body.role)) user.role = req.body.role;
  await user.save();
  res.json({ success: true, user });
}));

router.delete('/users/:id', asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) { res.status(400); throw new Error('Cannot delete yourself'); }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, message: 'User deleted' });
}));

// ─── INVESTMENTS ──────────────────────────────────────────────────────────────
const Investment = require('../models/Investment');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const { calcInvestment, calcMonthsActive } = require('../utils/investmentCalc');
const { sendReturnCredited, sendWithdrawalProcessed, sendInvestmentActivated, sendMilestoneReached } = require('../utils/mailer');

const computeStats = (inv) => {
  const deposits = inv.transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn = inv.transactions.filter(t => t.type === 'withdrawal_credit').reduce((s, t) => s + t.amount, 0);
  const netInvested = deposits - totalWithdrawn;
  const monthsActive = calcMonthsActive(inv.startDate);
  const { currentValue, growth, growthPercent } = calcInvestment(netInvested, inv.monthlyReturnPercent, monthsActive);
  return { principalAmount: deposits, totalWithdrawn, netInvested, monthsActive: parseFloat(monthsActive.toFixed(2)), currentValue: Math.round(currentValue), growthPercent: parseFloat(growthPercent.toFixed(2)) };
};

// GET /api/admin/investments/aum
router.get('/investments/aum', asyncHandler(async (req, res) => {
  const all = await Investment.find({ isActive: true }).populate('user', 'name');
  let totalAUM = 0, totalCurrentValue = 0, totalGrowthGiven = 0;
  all.forEach(inv => {
    const s = computeStats(inv);
    totalAUM += s.netInvested;
    totalCurrentValue += s.currentValue;
    totalGrowthGiven += (s.currentValue - s.netInvested);
  });
  const totalWithdrawals = await WithdrawalRequest.countDocuments({ status: 'approved' });
  const topPerformer = all.reduce((best, inv) => {
    const s = computeStats(inv);
    return (!best || s.growthPercent > best.growthPercent) ? { name: inv.user?.name, growthPercent: s.growthPercent } : best;
  }, null);
  res.json({ success: true, stats: { totalAUM: Math.round(totalAUM), totalCurrentValue: Math.round(totalCurrentValue), totalGrowthGiven: Math.round(totalGrowthGiven), activeInvestors: all.length, totalWithdrawals, topPerformer } });
}));

// GET /api/admin/investments
router.get('/investments', asyncHandler(async (req, res) => {
  const investments = await Investment.find().populate('user', 'name email phone').sort({ createdAt: -1 });
  const result = investments.map(inv => ({ ...inv.toObject(), ...computeStats(inv) }));
  res.json({ success: true, investments: result });
}));

// POST /api/admin/investments
router.post('/investments', asyncHandler(async (req, res) => {
  const { userId, monthlyReturnPercent, startDate, lockInMonths, initialDeposit, note } = req.body;
  if (!userId || !monthlyReturnPercent || !startDate) { res.status(400); throw new Error('userId, monthlyReturnPercent, startDate required'); }
  const existing = await Investment.findOne({ user: userId });
  if (existing) { res.status(400); throw new Error('User already has an investment account'); }
  const transactions = initialDeposit ? [{ type: 'deposit', amount: Number(initialDeposit), date: new Date(startDate), note: note || 'Initial deposit', creditedBy: req.user._id }] : [];
  const inv = await Investment.create({ user: userId, monthlyReturnPercent: Number(monthlyReturnPercent), startDate: new Date(startDate), lockInMonths: Number(lockInMonths || 0), transactions, createdBy: req.user._id });
  res.status(201).json({ success: true, investment: inv });
}));

// PATCH /api/admin/investments/:id/toggle
router.patch('/investments/:id/toggle', asyncHandler(async (req, res) => {
  const inv = await Investment.findById(req.params.id).populate('user', 'name email');
  if (!inv) { res.status(404); throw new Error('Investment not found'); }
  inv.isActive = !inv.isActive;
  await inv.save();
  if (inv.isActive && inv.user) {
    const stats = computeStats(inv);
    sendInvestmentActivated({ to: inv.user.email, name: inv.user.name, principal: stats.principalAmount, monthlyRate: inv.monthlyReturnPercent, startDate: inv.startDate });
  }
  res.json({ success: true, isActive: inv.isActive });
}));

// PATCH /api/admin/investments/:id/settings
router.patch('/investments/:id/settings', asyncHandler(async (req, res) => {
  const { monthlyReturnPercent, lockInMonths, startDate, notes } = req.body;
  const inv = await Investment.findById(req.params.id);
  if (!inv) { res.status(404); throw new Error('Investment not found'); }
  if (monthlyReturnPercent !== undefined) inv.monthlyReturnPercent = Number(monthlyReturnPercent);
  if (lockInMonths !== undefined) inv.lockInMonths = Number(lockInMonths);
  if (startDate) inv.startDate = new Date(startDate);
  if (notes !== undefined) inv.notes = notes;
  await inv.save();
  res.json({ success: true, investment: inv });
}));

// POST /api/admin/investments/:id/transaction
router.post('/investments/:id/transaction', asyncHandler(async (req, res) => {
  const { type, amount, date, note } = req.body;
  if (!type || !amount) { res.status(400); throw new Error('type and amount required'); }
  const inv = await Investment.findById(req.params.id);
  if (!inv) { res.status(404); throw new Error('Investment not found'); }
  inv.transactions.push({ type, amount: Number(amount), date: date ? new Date(date) : new Date(), note, creditedBy: req.user._id });
  await inv.save();
  res.json({ success: true, investment: inv });
}));

// DELETE /api/admin/investments/:id/transaction/:txId
router.delete('/investments/:id/transaction/:txId', asyncHandler(async (req, res) => {
  const inv = await Investment.findById(req.params.id);
  if (!inv) { res.status(404); throw new Error('Investment not found'); }
  inv.transactions = inv.transactions.filter(t => t._id.toString() !== req.params.txId);
  await inv.save();
  res.json({ success: true });
}));

// POST /api/admin/investments/:id/credit-return
router.post('/investments/:id/credit-return', asyncHandler(async (req, res) => {
  const { month, amount } = req.body;
  if (!month || !amount) { res.status(400); throw new Error('month and amount required'); }
  const inv = await Investment.findById(req.params.id).populate('user', 'name email');
  if (!inv) { res.status(404); throw new Error('Investment not found'); }
  inv.monthlyReturnLog.push({ month, amount: Number(amount), creditedBy: req.user._id });
  inv.transactions.push({ type: 'withdrawal_credit', amount: Number(amount), date: new Date(), note: `Return for ${month}`, creditedBy: req.user._id });
  await inv.save();

  const stats = computeStats(inv);
  const MILESTONES = [10, 25, 50, 100];
  MILESTONES.forEach(m => {
    if (stats.growthPercent >= m && stats.growthPercent - (Number(amount) / stats.netInvested * 100) < m) {
      sendMilestoneReached({ to: inv.user.email, name: inv.user.name, growthPercent: m, currentValue: stats.currentValue });
    }
  });
  if (inv.user) sendReturnCredited({ to: inv.user.email, name: inv.user.name, month, amount: Number(amount), currentValue: stats.currentValue });
  res.json({ success: true, investment: inv });
}));

// POST /api/admin/investments/:id/kyc
router.post('/investments/:id/kyc', asyncHandler(async (req, res) => {
  const { label, fileUrl } = req.body;
  if (!label || !fileUrl) { res.status(400); throw new Error('label and fileUrl required'); }
  const inv = await Investment.findById(req.params.id);
  if (!inv) { res.status(404); throw new Error('Investment not found'); }
  inv.kycDocuments.push({ label, fileUrl });
  await inv.save();
  res.json({ success: true, investment: inv });
}));

// GET /api/admin/withdrawal-requests
router.get('/withdrawal-requests', asyncHandler(async (req, res) => {
  const requests = await WithdrawalRequest.find()
    .populate('user', 'name email phone')
    .populate('investment', 'monthlyReturnPercent startDate')
    .sort({ requestedAt: -1 });
  res.json({ success: true, requests });
}));

// PATCH /api/admin/withdrawal-requests/:id
router.patch('/withdrawal-requests/:id', asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  if (!['approved', 'rejected'].includes(status)) { res.status(400); throw new Error('status must be approved or rejected'); }
  const wr = await WithdrawalRequest.findById(req.params.id).populate('user', 'name email');
  if (!wr) { res.status(404); throw new Error('Request not found'); }
  wr.status = status;
  wr.adminNote = adminNote || '';
  wr.processedBy = req.user._id;
  wr.processedAt = new Date();
  await wr.save();
  if (wr.user) sendWithdrawalProcessed({ to: wr.user.email, name: wr.user.name, amount: wr.amount, status, adminNote });
  res.json({ success: true, request: wr });
}));

module.exports = router;
