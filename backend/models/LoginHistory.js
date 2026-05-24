const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: String,
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  role: String,
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'INFO'],
    default: 'INFO'
  },
  actionType: {
    type: String,
    default: 'LOGIN'
  },
  targetType: {
    type: String,
    default: 'AUTH'
  },
  details: String,
  reason: String,
  ipAddress: String,
  userAgent: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.LoginHistory || mongoose.model('LoginHistory', loginHistorySchema);
