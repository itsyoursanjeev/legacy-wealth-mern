const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
  type: { type: String, enum: ['deposit', 'withdrawal_credit'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  note: { type: String },
  creditedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

const monthlyReturnLogSchema = new Schema({
  month: String,
  amount: Number,
  creditedAt: { type: Date, default: Date.now },
  creditedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

const kycDocumentSchema = new Schema({
  label: String,
  fileUrl: String,
  uploadedAt: { type: Date, default: Date.now }
});

const investmentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  isActive: { type: Boolean, default: false },
  monthlyReturnPercent: { type: Number, required: true },
  startDate: { type: Date, required: true },
  lockInMonths: { type: Number, default: 0 },
  transactions: [transactionSchema],
  monthlyReturnLog: [monthlyReturnLogSchema],
  kycDocuments: [kycDocumentSchema],
  notes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Investment', investmentSchema);
