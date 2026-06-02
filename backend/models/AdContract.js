const mongoose = require('mongoose');

const adContractSchema = new mongoose.Schema({
  advertiser: { type: String, required: true },
  campaign: { type: String, default: '' },
  type: { type: String, default: 'Ad Contract' },
  spots: { type: Number, default: 0 },
  aired: { type: Number, default: 0 },
  ratePerSpot: { type: Number, default: 0 },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('AdContract', adContractSchema);