const express = require('express');
const { protect } = require('../../middleware/auth');
const { requireAmAccess } = require('../../middleware/amAuth');

/**
 * Asset-management ("am") admin API, mounted at /api/admin/am - see docs/API_INTEGRATION.md
 * in `legacywealth admin/`. Entirely additive: does not touch the existing /api/admin/*
 * (Institute) routes or their `admin`-only middleware.
 *
 * Every sub-route requires a valid session (`protect`) AND an effective am role
 * (`requireAmAccess`); individual routes further gate by permission (see middleware/amAuth.js).
 */
const router = express.Router();
router.use(protect, requireAmAccess);

router.use('/dashboard', require('./dashboard'));
router.use('/investors', require('./investors'));
router.use('/portfolios', require('./portfolios'));
router.use('/ledger', require('./ledger'));
router.use('/trades', require('./trades'));
router.use('/prices', require('./prices'));
router.use('/documents', require('./documents'));
router.use('/audit', require('./audit'));
router.use('/team', require('./team'));

module.exports = router;
