const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const LedgerEntry = require('../../models/LedgerEntry');
const Trade = require('../../models/Trade');
const InvestorDocument = require('../../models/InvestorDocument');
const Portfolio = require('../../models/Portfolio');
const Blog = require('../../models/Blog');
const { requireAmPermission } = require('../../middleware/amAuth');
const { summariseLedger, computePositions } = require('../../utils/amCalc');
const { D, moneyStr, ZERO } = require('../../utils/amMoney');

const router = express.Router();

function toNews(b) {
  return {
    id: b._id.toString(), headline: b.title, summary: b.excerpt, body: b.content, category: b.category,
    author: b.author, thumbnailUrl: b.coverImage || undefined, publishedAt: b.publishedAt, updatedAt: b.updatedAt,
    status: b.isPublished ? 'published' : 'draft',
  };
}

/** Builds the last `span` calendar-month buckets (oldest first), keyed 'YYYY-MM' -> label. */
function monthBuckets(span) {
  const out = [];
  for (let k = span - 1; k >= 0; k--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - k);
    out.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleString('en-IN', { month: 'short' }) });
  }
  return out;
}

/**
 * Scoped-down relative to the demo dashboard: market value / unrealised P&L are omitted rather
 * than shown as zero, because no live price feed is connected (see routes/am/prices.js).
 * `valuationSeries` shows net contributed capital only (no fabricated market valuation) - there
 * is nothing dishonest to plot against it until a price feed exists.
 */
router.get('/', requireAmPermission('investors.view'), asyncHandler(async (req, res) => {
  const { from } = req.query;
  const span = from
    ? Math.max(1, Math.min(24, Math.round((Date.now() - new Date(from).getTime()) / (30 * 86400000)) + 1))
    : 6;

  const [totalInvestors, allDocs, confirmedTx, pendingTxCount, pendingTradeCount, pendingDocCount, portfolios, confirmedTrades, recentTrades, recentTx, recentBlogs] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    InvestorDocument.find(),
    LedgerEntry.find({ status: 'confirmed' }),
    LedgerEntry.countDocuments({ status: 'pending' }),
    Trade.countDocuments({ status: 'pending_review' }),
    InvestorDocument.countDocuments({ status: 'pending' }),
    Portfolio.find(),
    Trade.find({ status: 'confirmed' }),
    Trade.find().sort({ tradeAt: -1 }).limit(5),
    LedgerEntry.find().sort({ date: -1 }).limit(6),
    Blog.find().sort({ updatedAt: -1 }).limit(4),
  ]);

  const byInvestor = new Map();
  for (const d of allDocs) {
    const k = d.investorId.toString();
    if (!byInvestor.has(k)) byInvestor.set(k, []);
    byInvestor.get(k).push(d);
  }
  let verifiedInvestors = 0, pendingKyc = 0, notStartedKyc = 0, rejectedKyc = 0;
  for (const docs of byInvestor.values()) {
    if (docs.every((d) => d.status === 'verified')) verifiedInvestors++;
    else if (docs.some((d) => d.status === 'rejected')) rejectedKyc++;
    else pendingKyc++;
  }
  notStartedKyc = Math.max(0, totalInvestors - byInvestor.size);

  const ledger = summariseLedger(confirmedTx);

  const buckets = monthBuckets(span);
  const byMonth = new Map(buckets.map((b) => [b.key, { c: ZERO, w: ZERO }]));
  for (const t of confirmedTx) {
    const bucket = byMonth.get(t.date.toISOString().slice(0, 7));
    if (!bucket) continue;
    const eff = t.type === 'reversal' ? t.reversesType : t.type;
    const sign = t.type === 'reversal' ? -1 : 1;
    const amt = D(t.amount).times(sign);
    if (eff === 'contribution') bucket.c = bucket.c.plus(amt);
    if (eff === 'withdrawal') bucket.w = bucket.w.plus(amt);
  }
  const capitalSeries = buckets.map((b) => {
    const v = byMonth.get(b.key);
    return { label: b.label, Contributions: Number(moneyStr(v.c)), Withdrawals: Number(moneyStr(v.w)) };
  });

  const sortedTx = [...confirmedTx].sort((a, b) => a.date - b.date);
  let running = ZERO, txIdx = 0;
  const valuationSeries = buckets.map((b) => {
    const monthEnd = new Date(`${b.key}-01T00:00:00.000Z`);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
    monthEnd.setUTCMilliseconds(-1); // last instant of b.key's month
    while (txIdx < sortedTx.length && sortedTx[txIdx].date <= monthEnd) {
      const t = sortedTx[txIdx];
      const eff = t.type === 'reversal' ? t.reversesType : t.type;
      const sign = t.type === 'reversal' ? -1 : 1;
      if (eff === 'contribution') running = running.plus(D(t.amount).times(sign));
      if (eff === 'withdrawal') running = running.minus(D(t.amount).times(sign));
      txIdx += 1;
    }
    return { label: b.label, 'Net contributed capital': Number(moneyStr(running)) };
  });

  let realisedPnl = ZERO;
  const unsupportedSymbols = new Set();
  for (const p of portfolios) {
    const forPortfolio = confirmedTrades.filter((t) => t.portfolioId.toString() === p._id.toString())
      .map((t) => ({ id: t.id, portfolioId: t.portfolioId.toString(), symbol: t.symbol, instrumentType: t.instrumentType, side: t.side, tradeAt: t.tradeAt.toISOString(), quantity: t.quantity, price: t.price, charges: t.charges, status: t.status, reversesId: t.reversesId?.toString() }));
    try {
      const pos = computePositions(forPortfolio);
      realisedPnl = realisedPnl.plus(pos.realisedPnl);
      pos.unsupported.forEach((t) => unsupportedSymbols.add(t.symbol));
    } catch { /* an unconfirmed-state inconsistency would be a data bug, not a user-facing error here */ }
  }

  res.json({
    success: true,
    dashboard: {
      asOf: new Date().toISOString(),
      totalInvestors,
      verifiedInvestors,
      aum: moneyStr(ledger.netContributedCapital),
      verifiedContributions: moneyStr(ledger.contributions),
      realisedPnl: moneyStr(realisedPnl),
      valuationNote: 'AUM = net confirmed contributions less withdrawals in the asset-management ledger (started fresh; does not include the legacy fixed-return product, tracked separately in the Institute panel). No live price feed is connected, so market value and unrealised P&L are not shown.'
        + (unsupportedSymbols.size ? ` Instruments excluded from P&L pending an accounting policy: ${[...unsupportedSymbols].join(', ')}.` : ''),
      pending: [
        { label: 'Transactions awaiting confirmation', count: pendingTxCount, to: '/transactions?status=pending' },
        { label: 'Trades awaiting review', count: pendingTradeCount, to: '/trades?status=pending_review' },
        { label: 'KYC documents to review', count: pendingDocCount, to: '/compliance' },
      ],
      onboarding: [
        { label: 'Verified', count: verifiedInvestors },
        { label: 'In review', count: pendingKyc },
        { label: 'Not started', count: notStartedKyc },
        { label: 'Rejected', count: rejectedKyc },
      ],
      capitalSeries,
      valuationSeries,
      recentTrades,
      recentNews: recentBlogs.map(toNews),
      recentTransactions: recentTx,
    },
  });
}));

module.exports = router;
