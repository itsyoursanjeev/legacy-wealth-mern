const express = require('express');
const asyncHandler = require('express-async-handler');

const router = express.Router();

/**
 * No live price feed is connected (see docs/IMPLEMENTATION_REPORT.md "Live price feed /
 * valuation history"). Returning an empty object is the honest answer: positions stay
 * unpriced rather than showing an invented mark. Matches the frontend's handling of an
 * unpriced symbol (excluded from market value / unrealised P&L, listed as unpriced).
 */
router.get('/', asyncHandler(async (_req, res) => {
  res.json({ success: true, marks: {} });
}));

module.exports = router;
