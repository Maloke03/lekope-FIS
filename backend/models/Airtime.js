const mongoose = require('mongoose');

const airtimeSchema = new mongoose.Schema({
  client: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes or hours
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  scheduledDate: { type: Date, required: true },
  // Add other fields as needed
}, { timestamps: true });

module.exports = mongoose.model('Airtime', airtimeSchema);