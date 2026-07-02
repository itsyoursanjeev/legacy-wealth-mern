const mongoose = require('mongoose');
const { Schema } = mongoose;

const withdrawalRequestSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  investment: { type: Schema.Types.ObjectId, ref: 'Investment', required: true },
  amount: { type: Number, required: true },
  reason: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: { type: String },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  requestedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
