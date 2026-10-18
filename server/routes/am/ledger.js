const express = require('express');
const asyncHandler = require('express-async-handler');
const LedgerEntry = require('../../models/LedgerEntry');
const User = require('../../models/User');
const { nextSeq } = require('../../models/Counter');
const { requireAmPermission } = require('../../middleware/amAuth');
const { writeAudit } = require('../../utils/amAudit');
const { D, moneyStr } = require('../../utils/amMoney');
const { buildReversal, LedgerValidationError } = require('../../utils/amCalc');

const router = express.Router();

async function makeReference() {
  const n = await nextSeq('ledger');
  return `TXN-${String(n).padStart(6, '0')}`;
}

router.get('/', requireAmPermission('transactions.view'), asyncHandler(async (req, res) => {
  const { investorId, portfolioId, type, status, from, to, search } = req.query;
  const filter = {};
  if (investorId) filter.investorId = investorId;
  if (portfolioId) filter.portfolioId = portfolioId;
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(`${to}T23:59:59.999Z`);
  }
  let transactions = await LedgerEntry.find(filter).sort({ date: -1 });
  if (search) {
    const q = String(search).toLowerCase();
    transactions = transactions.filter((t) =>
      [t.reference, t._id.toString(), t.notes ?? ''].some((x) => (x || '').toLowerCase().includes(q)));
  }
  res.json({ success: true, transactions });
}));

router.post('/', requireAmPermission('transactions.record'), asyncHandler(async (req, res) => {
  const { investorId, portfolioId, type, amount, currency, date, notes, idempotencyKey } = req.body;

  if (idempotencyKey) {
    const existing = await LedgerEntry.findOne({ idempotencyKey });
    if (existing) return res.status(201).json({ success: true, transaction: existing });
  }

  const amt = D(amount);
  if (type !== 'adjustment' && amt.lte(0)) { res.status(400); throw new Error('Amount must be greater than zero'); }
  if (type === 'adjustment' && amt.isZero()) { res.status(400); throw new Error('Adjustment cannot be zero'); }
  const investor = await User.findOne({ _id: investorId, role: 'user' });
  if (!investor) { res.status(400); throw new Error('Unknown investor'); }
  if (type === 'adjustment' && !notes?.trim()) { res.status(400); throw new Error('An adjustment requires a reason in notes'); }

  let transaction;
  try {
    transaction = await LedgerEntry.create({
      reference: await makeReference(), investorId, portfolioId: portfolioId || undefined, type,
      amount: moneyStr(amt), currency: currency || 'INR', date: date ? new Date(date) : new Date(),
      status: 'pending', notes, createdBy: req.user.name, idempotencyKey: idempotencyKey || undefined,
    });
  } catch (e) {
    if (e.code === 11000 && idempotencyKey) {
      transaction = await LedgerEntry.findOne({ idempotencyKey });
    } else throw e;
  }

  await writeAudit(req, 'transaction.recorded', 'transaction', transaction.id, { type: transaction.type, amount: transaction.amount });
  res.status(201).json({ success: true, transaction });
}));

router.post('/:id/confirm', requireAmPermission('transactions.confirm'), asyncHandler(async (req, res) => {
  const tx = await LedgerEntry.findById(req.params.id);
  if (!tx) { res.status(404); throw new Error('Transaction not found'); }
  if (tx.status !== 'pending') { res.status(400); throw new Error(`Only pending entries can be confirmed (this one is ${tx.status})`); }
  if (tx.createdBy === req.user.name) { res.status(403); throw new Error('Separation of duties: you cannot confirm an entry you created.'); }

  tx.status = 'confirmed';
  tx.confirmedBy = req.user.name;
  tx.confirmedAt = new Date();
  await tx.save();

  if (tx.type === 'reversal' && tx.reversesId) {
    await LedgerEntry.findByIdAndUpdate(tx.reversesId, { reversedById: tx._id });
  }
  await writeAudit(req, 'transaction.confirmed', 'transaction', tx.id);
  res.json({ success: true, transaction: tx });
}));

router.post('/:id/reject', requireAmPermission('transactions.confirm'), asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const tx = await LedgerEntry.findById(req.params.id);
  if (!tx) { res.status(404); throw new Error('Transaction not found'); }
  if (tx.status !== 'pending') { res.status(400); throw new Error('Only pending entries can be rejected'); }
  if (!reason?.trim()) { res.status(400); throw new Error('A reason is required'); }

  tx.status = 'rejected';
  tx.notes = `${tx.notes ?? ''}${tx.notes ? ' | ' : ''}Rejected: ${reason}`;
  tx.confirmedBy = req.user.name;
  tx.confirmedAt = new Date();
  await tx.save();
  await writeAudit(req, 'transaction.rejected', 'transaction', tx.id, { reason });
  res.json({ success: true, transaction: tx });
}));

router.post('/:id/reverse', requireAmPermission('transactions.confirm'), asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason?.trim()) { res.status(400); throw new Error('A reason is required'); }
  const orig = await LedgerEntry.findById(req.params.id);
  if (!orig) { res.status(404); throw new Error('Transaction not found'); }

  const pendingReversal = await LedgerEntry.findOne({ reversesId: orig._id, status: 'pending' });
  if (pendingReversal) { res.status(400); throw new Error('A reversal for this entry is already pending'); }

  let built;
  try {
    built = buildReversal(
      { id: orig._id.toString(), type: orig.type, status: orig.status, reversedById: orig.reversedById, investorId: orig.investorId, portfolioId: orig.portfolioId, amount: orig.amount, currency: orig.currency },
      { reference: await makeReference(), createdBy: req.user.name, at: new Date(), reason },
    );
  } catch (e) {
    if (e instanceof LedgerValidationError) { res.status(400); throw new Error(e.message); }
    throw e;
  }

  const rev = await LedgerEntry.create(built);
  await writeAudit(req, 'transaction.reversal_requested', 'transaction', rev.id, { reverses: orig.id });
  res.status(201).json({ success: true, transaction: rev });
}));

module.exports = router;
