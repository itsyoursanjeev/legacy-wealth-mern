const mongoose = require('mongoose');
const { Schema } = mongoose;
const { idTransform } = require('../utils/toApiId');

// Append-only ledger entry. Original entries are never edited once confirmed; corrections
// are posted as a new `reversal` entry that must itself be confirmed by a different user
// (see routes/am/ledger.js and utils/amCalc.js). This is the intentional replacement for the
// legacy `Investment.transactions[]` sub-array, which allows deletion and has no such controls.
const ledgerEntrySchema = new Schema({
  reference: { type: String, required: true, unique: true },
  investorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  portfolioId: { type: Schema.Types.ObjectId, ref: 'Portfolio', index: true },
  type: { type: String, enum: ['contribution', 'withdrawal', 'fee', 'distribution', 'reversal', 'adjustment'], required: true },
  amount: { type: String, required: true }, // decimal string - never Number, see docs/API_INTEGRATION.md
  currency: { type: String, default: 'INR' },
  date: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending', index: true },
  notes: { type: String },
  reversesId: { type: Schema.Types.ObjectId, ref: 'LedgerEntry' },
  reversesType: { type: String, enum: ['contribution', 'withdrawal', 'fee', 'distribution', 'adjustment'] },
  reversedById: { type: Schema.Types.ObjectId, ref: 'LedgerEntry' },
  createdBy: { type: String, required: true }, // actor display name, see routes/am/ledger.js
  confirmedBy: { type: String },
  confirmedAt: { type: Date },
  idempotencyKey: { type: String, index: true, sparse: true, unique: true },
}, { timestamps: true, toJSON: { transform: idTransform } });

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);
