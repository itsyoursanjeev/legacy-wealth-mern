const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const Investment = require('../../models/Investment');
const Portfolio = require('../../models/Portfolio');
const InvestorDocument = require('../../models/InvestorDocument');
const { requireAmPermission } = require('../../middleware/amAuth');

const router = express.Router();

/**
 * Investors are read-only here, sourced from the existing `User` + `Investment` collections
 * (same data the Institute's own /api/admin/users + /api/admin/investments already expose,
 * reused per docs/API_INTEGRATION.md). This endpoint exists so `finance`/`operations`/
 * `compliance` roles - who cannot call the admin-only Institute endpoints - can still see
 * investors. There is no create/edit endpoint: the existing backend only supports User
 * create via public registration, and profile edits here would touch the shared User model
 * the public site also depends on (left as a documented gap).
 */

async function computeKyc(investorId, legacyHasDocs) {
  const docs = await InvestorDocument.find({ investorId });
  if (docs.length) {
    if (docs.every((d) => d.status === 'verified')) return 'verified';
    if (docs.some((d) => d.status === 'rejected')) return 'rejected';
    return 'pending';
  }
  // Legacy `Investment.kycDocuments` has files but no verification outcome - honestly
  // 'unknown' rather than claiming verified. No new-style records and no legacy files at
  // all means KYC genuinely has not started.
  return legacyHasDocs ? 'unknown' : 'not_started';
}

async function toInvestor(user, investment) {
  const [portfolios, kyc] = await Promise.all([
    Portfolio.find({ investorId: user._id }),
    computeKyc(user._id, !!(investment?.kycDocuments?.length)),
  ]);
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || undefined,
    status: user.isActive ? 'active' : 'inactive',
    kyc,
    onboardedAt: (investment?.startDate ?? user.createdAt).toISOString(),
    portfolioIds: portfolios.map((p) => p._id.toString()),
    notes: investment?.notes || undefined,
  };
}

router.get('/', requireAmPermission('investors.view'), asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const filter = { role: 'user' };
  if (status === 'active') filter.isActive = true;
  else if (status === 'inactive' || status === 'suspended') filter.isActive = false;

  let users = await User.find(filter).sort({ createdAt: -1 });
  if (search) {
    const q = String(search).toLowerCase();
    users = users.filter((u) => [u.name, u.email, u._id.toString(), u.phone ?? ''].some((x) => x.toLowerCase().includes(q)));
  }

  const investments = await Investment.find({ user: { $in: users.map((u) => u._id) } });
  const invByUser = new Map(investments.map((i) => [i.user.toString(), i]));
  const investors = await Promise.all(users.map((u) => toInvestor(u, invByUser.get(u._id.toString()))));
  res.json({ success: true, investors });
}));

router.get('/:id', requireAmPermission('investors.view'), asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'user' });
  if (!user) { res.status(404); throw new Error('Investor not found'); }
  const investment = await Investment.findOne({ user: user._id });
  res.json({ success: true, investor: await toInvestor(user, investment) });
}));

module.exports = router;
