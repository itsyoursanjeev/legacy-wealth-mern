const express = require('express');
const asyncHandler = require('express-async-handler');
const PDFDocument = require('pdfkit');
const Investment = require('../models/Investment');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const { protect } = require('../middleware/auth');
const { calcInvestment, calcProjections, calcMonthsActive } = require('../utils/investmentCalc');

const router = express.Router();
router.use(protect);

// Compute all derived fields for a user's investment
const buildInvestmentView = (inv) => {
  const deposits = inv.transactions
    .filter(t => t.type === 'deposit')
    .reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn = inv.transactions
    .filter(t => t.type === 'withdrawal_credit')
    .reduce((s, t) => s + t.amount, 0);
  const netInvested = deposits - totalWithdrawn;
  const monthsActive = calcMonthsActive(inv.startDate);
  const { currentValue, growth, growthPercent } = calcInvestment(netInvested, inv.monthlyReturnPercent, monthsActive);
  const projections = calcProjections(netInvested, inv.monthlyReturnPercent, monthsActive);
  const lockInEndsAt = new Date(new Date(inv.startDate).getTime() + inv.lockInMonths * 30.44 * 24 * 60 * 60 * 1000);
  const canWithdraw = inv.lockInMonths === 0 || monthsActive >= inv.lockInMonths;
  const benchmarks = {
    fd: Math.round(netInvested * Math.pow(1 + 0.065 / 12, monthsActive)),
    nifty: Math.round(netInvested * Math.pow(1 + 0.12 / 12, monthsActive))
  };
  const days = Math.floor((Date.now() - new Date(inv.startDate).getTime()) / (1000 * 60 * 60 * 24));

  return {
    _id: inv._id,
    isActive: inv.isActive,
    monthlyReturnPercent: inv.monthlyReturnPercent,
    startDate: inv.startDate,
    lockInMonths: inv.lockInMonths,
    lockInEndsAt,
    canWithdraw,
    principalAmount: deposits,
    totalWithdrawn,
    netInvested,
    monthsActive: parseFloat(monthsActive.toFixed(2)),
    daysActive: days,
    currentValue: Math.round(currentValue),
    totalGrowthAmount: Math.round(growth),
    totalGrowthPercent: parseFloat(growthPercent.toFixed(2)),
    projections,
    benchmarks,
    transactions: [...inv.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)),
    monthlyReturnLog: [...inv.monthlyReturnLog].sort((a, b) => new Date(b.creditedAt) - new Date(a.creditedAt)),
    kycDocuments: inv.kycDocuments
  };
};

// GET /api/investments/me
router.get('/me', asyncHandler(async (req, res) => {
  const inv = await Investment.findOne({ user: req.user._id });
  if (!inv || !inv.isActive) return res.json({ active: false });
  res.json({ active: true, investment: buildInvestmentView(inv) });
}));

// POST /api/investments/withdrawal-request
router.post('/withdrawal-request', asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  if (!amount || amount <= 0) { res.status(400); throw new Error('Valid amount required'); }

  const inv = await Investment.findOne({ user: req.user._id, isActive: true });
  if (!inv) { res.status(404); throw new Error('No active investment found'); }

  const view = buildInvestmentView(inv);
  if (!view.canWithdraw) {
    res.status(400);
    throw new Error(`Lock-in period active until ${new Date(view.lockInEndsAt).toLocaleDateString('en-IN')}`);
  }

  const existing = await WithdrawalRequest.findOne({ user: req.user._id, status: 'pending' });
  if (existing) { res.status(400); throw new Error('You already have a pending withdrawal request'); }

  const wr = await WithdrawalRequest.create({
    user: req.user._id,
    investment: inv._id,
    amount,
    reason
  });
  res.status(201).json({ success: true, request: wr });
}));

// GET /api/investments/withdrawal-requests
router.get('/withdrawal-requests', asyncHandler(async (req, res) => {
  const requests = await WithdrawalRequest.find({ user: req.user._id })
    .sort({ requestedAt: -1 });
  res.json({ success: true, requests });
}));

// GET /api/investments/me/statement?from=YYYY-MM&to=YYYY-MM
router.get('/me/statement', asyncHandler(async (req, res) => {
  const inv = await Investment.findOne({ user: req.user._id });
  if (!inv) { res.status(404); throw new Error('No investment found'); }

  const { from, to } = req.query;
  const fromDate = from ? new Date(from + '-01') : null;
  const toDate = to ? new Date(to + '-31') : null;

  const view = buildInvestmentView(inv);

  const txns = view.transactions.filter(t => {
    if (fromDate && new Date(t.date) < fromDate) return false;
    if (toDate && new Date(t.date) > toDate) return false;
    return true;
  });
  const returns = view.monthlyReturnLog.filter(r => {
    if (fromDate && new Date(r.creditedAt) < fromDate) return false;
    if (toDate && new Date(r.creditedAt) > toDate) return false;
    return true;
  });

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="LW-Statement-${req.user.name.replace(/\s+/g, '-')}.pdf"`);
  doc.pipe(res);

  // Header bar
  doc.rect(0, 0, doc.page.width, 80).fill('#0D1B2A');
  doc.fillColor('#C9A84C').fontSize(18).font('Helvetica-Bold')
    .text('LEGACY WEALTH INSTITUTE', 50, 22);
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica')
    .text('Investment Statement', 50, 48);

  // User info block
  doc.fillColor('#0D1B2A').fontSize(11).font('Helvetica-Bold')
    .text('Investor Details', 50, 100);
  doc.font('Helvetica').fontSize(10).fillColor('#333')
    .text(`Name: ${req.user.name}`, 50, 118)
    .text(`Email: ${req.user.email}`, 50, 133)
    .text(`Period: ${from || 'Inception'} to ${to || 'Present'}`, 50, 148)
    .text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 50, 163);

  // Summary box
  doc.rect(50, 185, doc.page.width - 100, 100).fillAndStroke('#FDF8EE', '#C9A84C');
  doc.fillColor('#0D1B2A').font('Helvetica-Bold').fontSize(11).text('Portfolio Summary', 65, 198);
  const summaryY = 218;
  const col1 = 65, col2 = 230, col3 = 380;
  doc.font('Helvetica').fontSize(9).fillColor('#666')
    .text('Net Invested', col1, summaryY).text('Current Value', col2, summaryY).text('Total Growth', col3, summaryY);
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#0D1B2A')
    .text(`₹${view.netInvested.toLocaleString('en-IN')}`, col1, summaryY + 14)
    .text(`₹${view.currentValue.toLocaleString('en-IN')}`, col2, summaryY + 14);
  doc.fillColor('#27AE60')
    .text(`₹${view.totalGrowthAmount.toLocaleString('en-IN')} (${view.totalGrowthPercent.toFixed(2)}%)`, col3, summaryY + 14);

  doc.moveDown(7);

  // Transactions table
  if (txns.length > 0) {
    doc.fillColor('#0D1B2A').font('Helvetica-Bold').fontSize(11).text('Transactions', 50, 305);
    const tHeaders = ['Date', 'Type', 'Amount', 'Note'];
    const tWidths = [100, 130, 100, 170];
    let ty = 322;
    doc.rect(50, ty, doc.page.width - 100, 20).fill('#0D1B2A');
    let tx = 50;
    tHeaders.forEach((h, i) => {
      doc.fillColor('#C9A84C').font('Helvetica-Bold').fontSize(9).text(h, tx + 5, ty + 5, { width: tWidths[i] });
      tx += tWidths[i];
    });
    ty += 20;
    txns.forEach((t, idx) => {
      if (ty > 720) { doc.addPage(); ty = 50; }
      if (idx % 2 === 0) doc.rect(50, ty, doc.page.width - 100, 18).fill('#f9f9f9');
      tx = 50;
      const row = [
        new Date(t.date).toLocaleDateString('en-IN'),
        t.type === 'deposit' ? 'Deposit' : 'Return Credit',
        `₹${t.amount.toLocaleString('en-IN')}`,
        t.note || '—'
      ];
      row.forEach((cell, i) => {
        doc.fillColor('#333').font('Helvetica').fontSize(9)
          .text(cell, tx + 5, ty + 4, { width: tWidths[i] - 5 });
        tx += tWidths[i];
      });
      ty += 18;
    });
  }

  // Monthly Returns table
  if (returns.length > 0) {
    const startY = txns.length > 0 ? Math.min(doc.y + 20, 700) : 305;
    if (startY > 650) doc.addPage();
    doc.fillColor('#0D1B2A').font('Helvetica-Bold').fontSize(11).text('Monthly Return Credits', 50, startY);
    let ry = startY + 17;
    doc.rect(50, ry, doc.page.width - 100, 20).fill('#0D1B2A');
    doc.fillColor('#C9A84C').font('Helvetica-Bold').fontSize(9)
      .text('Month', 55, ry + 5).text('Amount', 200, ry + 5).text('Credited On', 350, ry + 5);
    ry += 20;
    returns.forEach((r, idx) => {
      if (ry > 720) { doc.addPage(); ry = 50; }
      if (idx % 2 === 0) doc.rect(50, ry, doc.page.width - 100, 18).fill('#f9f9f9');
      doc.fillColor('#333').font('Helvetica').fontSize(9)
        .text(r.month || '—', 55, ry + 4)
        .text(`₹${Number(r.amount).toLocaleString('en-IN')}`, 200, ry + 4)
        .text(new Date(r.creditedAt).toLocaleDateString('en-IN'), 350, ry + 4);
      ry += 18;
    });
  }

  // Footer
  const pageCount = doc.bufferedPageRange().count + 1;
  doc.fontSize(8).fillColor('#aaa')
    .text('This is a computer-generated statement. No signature required.', 50, doc.page.height - 40, { align: 'center' });

  doc.end();
}));

module.exports = router;
