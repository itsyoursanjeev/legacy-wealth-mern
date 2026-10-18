const mongoose = require('mongoose');
const { Schema } = mongoose;
const { idTransform } = require('../utils/toApiId');

// KYC / investor document record for the am admin. Separate from the legacy
// `Investment.kycDocuments[]` sub-array, which has no review/status workflow.
// `fileUrl` is a placeholder field only - no secure storage or signed-URL download is wired
// yet (see docs/IMPLEMENTATION_REPORT.md "Secure file download").
const investorDocumentSchema = new Schema({
  investorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  kind: { type: String, required: true, trim: true },
  fileName: { type: String, required: true, trim: true },
  fileUrl: { type: String },
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending', index: true },
  reviewedBy: { type: String },
  reviewedAt: { type: Date },
}, { timestamps: { createdAt: 'uploadedAt', updatedAt: false }, toJSON: { transform: idTransform } });

module.exports = mongoose.model('InvestorDocument', investorDocumentSchema);
