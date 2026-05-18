const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: { type: String, enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'MOMO', 'CREDIT_CARD'], required: true },
  reference: String,
  date: { type: Date, default: Date.now },
  notes: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const invoiceSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  client: { type: String, required: true },
  clientEmail: String,
  clientPhone: String,
  issue: { type: String, required: true },
  due: { type: String, required: true },
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['DRAFT', 'SENT', 'PENDING', 'PAID', 'OVERDUE', 'WRITTEN_OFF', 'PARTIAL'],
    default: 'DRAFT'
  },
  items: [{
    description: String,
    quantity: Number,
    rate: Number,
    amount: Number
  }],
  payments: [paymentSchema],
  writeOffReason: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
invoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);