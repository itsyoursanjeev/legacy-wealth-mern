const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // Contact
  name:      { type: String, default: '', trim: true },
  firstName: { type: String, default: '', trim: true },
  lastName:  { type: String, default: '', trim: true },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please use a valid Indian mobile number']
  },

  // Profile
  city: { type: String, default: '', trim: true },
  age: {
    type: String,
    enum: ['Under 18', '18–24', '25–34', '35–44', '45+', ''],
    default: ''
  },
  tradingExperience: {
    type: String,
    enum: ['None', 'Less than 1 year', '1–3 years', '3+ years', ''],
    default: ''
  },
  plannedCapital: {
    type: String,
    enum: ['Under ₹50K', '₹50K – ₹2L', '₹2L – ₹5L', '₹5L – ₹10L', 'Above ₹10L', ''],
    default: ''
  },
  preferredContactTime: {
    type: String,
    enum: ['Morning (9–12)', 'Afternoon (12–5)', 'Evening (5–9)', 'Anytime', ''],
    default: ''
  },
  interestedCourse: { type: String, default: 'General', trim: true },

  // Metadata
  source: {
    type: String,
    enum: ['Instagram DM', 'Website', 'YouTube', 'Webinar', 'Referral', 'Ad Campaign', 'Popup', 'Other'],
    default: 'Website'
  },
  sourcePage:          { type: String, default: '/' },
  interest:            { type: String, enum: ['Mentorship', 'SMC Course', 'Forex', 'Investing', 'Foundation', 'General'], default: 'General' },
  message:             { type: String, default: '', maxlength: 1000 },
  brochureDownloaded:  { type: Boolean, default: false },

  // CRM
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
    default: 'new'
  },
  notes:      { type: String, default: '' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);