const mongoose = require('mongoose');
const { Schema } = mongoose;
const { idTransform } = require('../utils/toApiId');

// Maker-checker trade record. `draft` -> `pending_review` -> `confirmed`/`rejected`.
// A confirmed trade is reversed by creating a new opposite-side trade referencing it
// (routes/am/trades.js), never by editing the original. See utils/amCalc.js for the
// weighted-average-cost position/P&L engine this feeds.
const tradeSchema = new Schema({
  reference: { type: String, trim: true },
  portfolioId: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true, index: true },
  symbol: { type: String, required: true, trim: true, uppercase: true },
  instrumentType: { type: String, enum: ['equity', 'etf', 'mutual_fund', 'bond', 'commodity', 'crypto', 'fno', 'forex'], required: true },
  side: { type: String, enum: ['buy', 'sell'], required: true },
  tradeAt: { type: Date, required: true },
  quantity: { type: String, required: true }, // decimal string, up to 8dp
  price: { type: String, required: true },
  charges: { type: String, default: '0' },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['draft', 'pending_review', 'confirmed', 'rejected'], default: 'draft', index: true },
  source: { type: String, enum: ['manual', 'broker_verified'], default: 'manual' },
  notes: { type: String },
  reversesId: { type: Schema.Types.ObjectId, ref: 'Trade' },
  reversedById: { type: Schema.Types.ObjectId, ref: 'Trade' },
  createdBy: { type: String, required: true },
  reviewedBy: { type: String },
  reviewedAt: { type: Date },
  idempotencyKey: { type: String, index: true, sparse: true, unique: true },
}, { timestamps: true, toJSON: { transform: idTransform } });

module.exports = mongoose.model('Trade', tradeSchema);
