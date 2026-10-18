const mongoose = require('mongoose');
const { Schema } = mongoose;
const { idTransform } = require('../utils/toApiId');

const portfolioSchema = new Schema({
  investorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, default: 'Primary Portfolio' },
  status: { type: String, enum: ['active', 'paused', 'closed'], default: 'active' },
  baseCurrency: { type: String, default: 'INR' },
  openedAt: { type: Date, default: Date.now },
}, { timestamps: true, toJSON: { transform: idTransform } });

module.exports = mongoose.model('Portfolio', portfolioSchema);
