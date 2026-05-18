const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const VALID_ROLES = [
  'STATION_MANAGER',
  'FINANCE_OFFICER',
  'MARKETING_OFFICER',
  'STAFF',
  'AUDITOR'
];

const normalizeRole = (role = '') => role.toString().trim().toUpperCase().replace(/\s+/g, '_');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: VALID_ROLES,
    set: normalizeRole,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  }
});

userSchema.pre('validate', function(next) {
  if (this.role) this.role = normalizeRole(this.role);
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
module.exports.VALID_ROLES = VALID_ROLES;
module.exports.normalizeRole = normalizeRole;
