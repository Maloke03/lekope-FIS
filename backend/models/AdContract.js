const mongoose = require('mongoose');

const adContractSchema = new mongoose.Schema({
  advertiser: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  // Add other fields as needed
}, { timestamps: true });

module.exports = mongoose.model('AdContract', adContractSchema);