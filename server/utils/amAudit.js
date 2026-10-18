const AuditLog = require('../models/AuditLog');

/**
 * Writes one append-only audit row. Call this from every am mutation route, after the
 * mutation succeeds, with the same action-string convention as the frontend's demo repo
 * (e.g. 'transaction.recorded', 'trade.confirmed') so audit output means the same thing in
 * demo and live mode.
 */
async function writeAudit(req, action, entity, entityId, meta) {
  await AuditLog.create({
    actor: req.user?.name ?? 'system',
    actorId: req.user?._id,
    action,
    entity,
    entityId: String(entityId),
    meta,
  });
}

module.exports = { writeAudit };
