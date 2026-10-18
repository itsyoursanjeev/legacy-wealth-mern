const express = require('express');
const asyncHandler = require('express-async-handler');
const Portfolio = require('../../models/Portfolio');
const User = require('../../models/User');
const { requireAmPermission } = require('../../middleware/amAuth');

const router = express.Router();

// The frontend's Repo interface only lists portfolios (used to populate Investor.portfolioIds
// and per-portfolio views assembled client-side from /ledger and /trades); there is no
// create-portfolio screen yet. POST exists for the documented contract (docs/API_INTEGRATION.md)
// and for staff to provision a portfolio via direct API call ahead of UI support.

router.get('/', requireAmPermission('investors.view'), asyncHandler(async (req, res) => {
  const { investorId } = req.query;
  const filter = {};
  if (investorId) filter.investorId = investorId;
  const portfolios = await Portfolio.find(filter).sort({ openedAt: -1 });
  res.json({ success: true, portfolios });
}));

router.post('/', requireAmPermission('investors.edit'), asyncHandler(async (req, res) => {
  const { investorId, name, baseCurrency } = req.body;
  if (!investorId) { res.status(400); throw new Error('investorId is required'); }
  const investor = await User.findOne({ _id: investorId, role: 'user' });
  if (!investor) { res.status(404); throw new Error('Investor not found'); }
  const portfolio = await Portfolio.create({
    investorId, name: name?.trim() || 'Primary Portfolio', baseCurrency: baseCurrency || 'INR',
  });
  res.status(201).json({ success: true, portfolio });
}));

module.exports = router;
