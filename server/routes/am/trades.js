const express = require('express');
const asyncHandler = require('express-async-handler');
const Trade = require('../../models/Trade');
const Portfolio = require('../../models/Portfolio');
const { requireAmPermission } = require('../../middleware/amAuth');
const { writeAudit } = require('../../utils/amAudit');
const { checkTrade, computePositions, TradeValidationError } = require('../../utils/amCalc');

const router = express.Router();

/** Maps a Mongoose Trade doc to the plain shape utils/amCalc.js expects (`id` + ISO `tradeAt`). */
function toCalcTrade(t) {
  return {
    id: t._id.toString(), portfolioId: t.portfolioId.toString(), symbol: t.symbol, instrumentType: t.instrumentType,
    side: t.side, tradeAt: t.tradeAt.toISOString(), quantity: t.quantity, price: t.price, charges: t.charges,
    status: t.status, reference: t.reference, reversesId: t.reversesId?.toString(),
  };
}

router.get('/', requireAmPermission('trades.view'), asyncHandler(async (req, res) => {
  const { portfolioId, side, status, from, to, search } = req.query;
  const filter = {};
  if (portfolioId) filter.portfolioId = portfolioId;
  if (side) filter.side = side;
  if (status) filter.status = status;
  if (from || to) {
    filter.tradeAt = {};
    if (from) filter.tradeAt.$gte = new Date(from);
    if (to) filter.tradeAt.$lte = new Date(`${to}T23:59:59.999Z`);
  }
  let trades = await Trade.find(filter).sort({ tradeAt: -1 });
  if (search) {
    const q = String(search).toLowerCase();
    trades = trades.filter((t) => [t.symbol, t.reference ?? '', t._id.toString(), t.portfolioId.toString()].some((x) => x.toLowerCase().includes(q)));
  }
  res.json({ success: true, trades });
}));

router.post('/', requireAmPermission('trades.enter'), asyncHandler(async (req, res) => {
  const { portfolioId, symbol, instrumentType, side, tradeAt, quantity, price, charges, currency, reference, notes, submit, idempotencyKey } = req.body;

  if (idempotencyKey) {
    const existing = await Trade.findOne({ idempotencyKey });
    if (existing) return res.status(201).json({ success: true, trade: existing });
  }

  const portfolio = await Portfolio.findById(portfolioId);
  if (!portfolio) { res.status(400); throw new Error('Unknown portfolio'); }

  const input = { portfolioId, symbol, instrumentType, side, tradeAt, quantity, price, charges: charges || '0', reference };
  const all = (await Trade.find({ portfolioId })).map(toCalcTrade);

  const dupCheck = checkTrade(input, all.filter((t) => t.status !== 'rejected' && t.reference));
  const dupRef = dupCheck.errors.find((e) => e.includes('already exists'));
  const simCheck = checkTrade(input, all.filter((t) => t.status === 'confirmed'));
  const errors = [...(dupRef ? [dupRef] : []), ...simCheck.errors.filter((e) => !e.includes('already exists'))];
  if (errors.length) { res.status(400); throw new Error(errors.join('. ')); }

  let trade;
  try {
    trade = await Trade.create({
      reference: reference?.trim() || undefined, portfolioId, symbol: symbol.trim().toUpperCase(), instrumentType, side,
      tradeAt: new Date(tradeAt), quantity, price, charges: charges || '0', currency: currency || 'INR',
      status: submit ? 'pending_review' : 'draft', source: 'manual', notes, createdBy: req.user.name,
      idempotencyKey: idempotencyKey || undefined,
    });
  } catch (e) {
    if (e.code === 11000 && idempotencyKey) trade = await Trade.findOne({ idempotencyKey });
    else throw e;
  }

  await writeAudit(req, 'trade.recorded', 'trade', trade.id, { symbol: trade.symbol, side: trade.side, status: trade.status });
  res.status(201).json({ success: true, trade });
}));

router.post('/:id/submit', requireAmPermission('trades.enter'), asyncHandler(async (req, res) => {
  const t = await Trade.findById(req.params.id);
  if (!t) { res.status(404); throw new Error('Trade not found'); }
  if (t.status !== 'draft') { res.status(400); throw new Error('Only drafts can be submitted'); }
  t.status = 'pending_review';
  await t.save();
  await writeAudit(req, 'trade.submitted', 'trade', t.id);
  res.json({ success: true, trade: t });
}));

router.post('/:id/confirm', requireAmPermission('trades.review'), asyncHandler(async (req, res) => {
  const t = await Trade.findById(req.params.id);
  if (!t) { res.status(404); throw new Error('Trade not found'); }
  if (t.status !== 'pending_review') { res.status(400); throw new Error('Only trades pending review can be confirmed'); }
  if (t.createdBy === req.user.name) { res.status(403); throw new Error('Separation of duties: you cannot confirm a trade you entered.'); }

  const others = (await Trade.find({ portfolioId: t.portfolioId, status: 'confirmed' })).map(toCalcTrade);
  try {
    computePositions([...others, { ...toCalcTrade(t), status: 'confirmed' }]);
  } catch (e) {
    if (e instanceof TradeValidationError) { res.status(400); throw new Error(e.message); }
    throw e;
  }

  t.status = 'confirmed';
  t.reviewedBy = req.user.name;
  t.reviewedAt = new Date();
  await t.save();
  if (t.reversesId) await Trade.findByIdAndUpdate(t.reversesId, { reversedById: t._id });
  await writeAudit(req, 'trade.confirmed', 'trade', t.id);
  res.json({ success: true, trade: t });
}));

router.post('/:id/reject', requireAmPermission('trades.review'), asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const t = await Trade.findById(req.params.id);
  if (!t) { res.status(404); throw new Error('Trade not found'); }
  if (t.status !== 'pending_review') { res.status(400); throw new Error('Only trades pending review can be rejected'); }
  if (!reason?.trim()) { res.status(400); throw new Error('A reason is required'); }

  t.status = 'rejected';
  t.reviewedBy = req.user.name;
  t.reviewedAt = new Date();
  t.notes = `${t.notes ?? ''}${t.notes ? ' | ' : ''}Rejected: ${reason}`;
  await t.save();
  await writeAudit(req, 'trade.rejected', 'trade', t.id, { reason });
  res.json({ success: true, trade: t });
}));

router.post('/:id/reverse', requireAmPermission('trades.review'), asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason?.trim()) { res.status(400); throw new Error('A reason is required'); }
  const o = await Trade.findById(req.params.id);
  if (!o) { res.status(404); throw new Error('Trade not found'); }
  if (o.status !== 'confirmed' || o.reversesId) { res.status(400); throw new Error('Only confirmed, original trades can be reversed'); }

  const otherReversalPending = await Trade.findOne({ reversesId: o._id, status: { $ne: 'rejected' } });
  if (o.reversedById || otherReversalPending) { res.status(400); throw new Error('This trade already has a reversal'); }

  const rev = await Trade.create({
    portfolioId: o.portfolioId, symbol: o.symbol, instrumentType: o.instrumentType, side: o.side === 'buy' ? 'sell' : 'buy',
    tradeAt: new Date(), quantity: o.quantity, price: o.price, charges: o.charges, currency: o.currency,
    status: 'pending_review', source: o.source, reversesId: o._id, notes: `Reversal of ${o.id}: ${reason}`, createdBy: req.user.name,
  });
  await writeAudit(req, 'trade.reversal_requested', 'trade', rev.id, { reverses: o.id });
  res.status(201).json({ success: true, trade: rev });
}));

module.exports = router;
