const express = require('express');
const asyncHandler = require('express-async-handler');
const AuditLog = require('../../models/AuditLog');
const { requireAmPermission } = require('../../middleware/amAuth');

const router = express.Router();

// Read-only by design: no update or delete route exists for audit rows.
router.get('/', requireAmPermission('audit.view'), asyncHandler(async (req, res) => {
  const { search } = req.query;
  let entries = await AuditLog.find().sort({ at: -1 }).limit(500);
  if (search) {
    const q = String(search).toLowerCase();
    entries = entries.filter((a) => [a.actor, a.action, a.entity, a.entityId].some((x) => (x || '').toLowerCase().includes(q)));
  }
  res.json({ success: true, entries });
}));

module.exports = router;
