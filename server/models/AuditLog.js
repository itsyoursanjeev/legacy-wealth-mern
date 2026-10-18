const mongoose = require('mongoose');
const { Schema } = mongoose;
const { idTransform } = require('../utils/toApiId');

// Append-only, read-only (no update/delete route exists - see routes/am/audit.js).
// `meta` must only ever hold non-sensitive, short string values: never passwords, tokens,
// or document contents (enforced by the Map<String,String> shape).
const auditLogSchema = new Schema({
  actor: { type: String, required: true },
  actorId: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true, index: true },
  entity: { type: String, required: true, index: true },
  entityId: { type: String, required: true },
  meta: { type: Map, of: String },
}, { timestamps: { createdAt: 'at', updatedAt: false }, toJSON: { transform: idTransform } });

module.exports = mongoose.model('AuditLog', auditLogSchema);
