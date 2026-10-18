const express = require('express');
const asyncHandler = require('express-async-handler');
const InvestorDocument = require('../../models/InvestorDocument');
const { requireAmPermission } = require('../../middleware/amAuth');
const { writeAudit } = require('../../utils/amAudit');

const router = express.Router();

router.get('/', requireAmPermission('documents.view'), asyncHandler(async (req, res) => {
  const { investorId, status } = req.query;
  const filter = {};
  if (investorId) filter.investorId = investorId;
  if (status) filter.status = status;
  const documents = await InvestorDocument.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, documents });
}));

// No upload UI exists yet (see docs/IMPLEMENTATION_REPORT.md "Secure file download"). This
// lets staff register a document record (e.g. after an out-of-band upload) so the review
// workflow below can be exercised ahead of real storage being wired up.
router.post('/', requireAmPermission('documents.review'), asyncHandler(async (req, res) => {
  const { investorId, kind, fileName, fileUrl } = req.body;
  if (!investorId || !kind || !fileName) { res.status(400); throw new Error('investorId, kind and fileName are required'); }
  const doc = await InvestorDocument.create({ investorId, kind, fileName, fileUrl });
  await writeAudit(req, 'document.registered', 'document', doc.id, { kind });
  res.status(201).json({ success: true, document: doc });
}));

router.post('/:id/review', requireAmPermission('documents.review'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['verified', 'rejected'].includes(status)) { res.status(400); throw new Error('status must be verified or rejected'); }
  const doc = await InvestorDocument.findById(req.params.id);
  if (!doc) { res.status(404); throw new Error('Document not found'); }
  doc.status = status;
  doc.reviewedBy = req.user.name;
  doc.reviewedAt = new Date();
  await doc.save();
  await writeAudit(req, `document.${status}`, 'document', doc.id);
  res.json({ success: true, document: doc });
}));

router.get('/:id/download-url', requireAmPermission('documents.view'), asyncHandler(async (req, res) => {
  res.status(501);
  throw new Error('Secure document storage is not implemented yet: there is no signed-URL download to serve. See docs/IMPLEMENTATION_REPORT.md.');
}));

module.exports = router;
