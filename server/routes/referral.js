const express = require('express');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/referral/my-code
router.get('/my-code', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({
    referralCode: user.referralCode,
    referralCount: user.referralCount,
    referralDiscountEarned: user.referralDiscountEarned
  });
}));

// @route   GET /api/referral/validate/:code
router.get('/validate/:code', asyncHandler(async (req, res) => {
  const referrer = await User.findOne({ referralCode: req.params.code });
  if (!referrer) {
    return res.json({ valid: false });
  }
  res.json({ valid: true, referrerName: referrer.name.split(' ')[0] });
}));

module.exports = router;
