const Invoice = require('../models/Invoice');
const { createPaymentProof, verifyPaymentLedger } = require('../utils/blockchainLedger');

// Get all invoices
const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

// Get single invoice
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ id: req.params.id });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// Create new invoice
const createInvoice = async (req, res) => {
  try {
    const invoice = new Invoice({
      ...req.body,
      createdBy: req.user._id
    });
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

// Update invoice
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

// Record payment
const recordPayment = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ id: req.params.id });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const { amount, method, reference, date, notes } = req.body;
    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero' });
    }

    const remainingBalance = invoice.amount - (invoice.paidAmount || 0);
    if (paymentAmount > remainingBalance) {
      return res.status(400).json({ error: 'Payment amount cannot exceed remaining balance' });
    }

    const payment = {
      amount: paymentAmount,
      method,
      reference,
      date: date ? new Date(date) : new Date(),
      notes,
      recordedBy: req.user._id
    };

    payment.blockchainProof = createPaymentProof({ invoice, payment });
    invoice.payments.push(payment);
    invoice.blockchainLedgerTip = payment.blockchainProof.blockHash;
    invoice.paidAmount = (invoice.paidAmount || 0) + paymentAmount;
    
    // Update status based on payment
    if (invoice.paidAmount >= invoice.amount) {
      invoice.status = 'PAID';
    } else if (invoice.paidAmount > 0) {
      invoice.status = 'PARTIAL';
    }
    
    await invoice.save();
    res.json(invoice);
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
};

// Verify invoice payment ledger
const verifyInvoiceLedger = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ id: req.params.id });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(verifyPaymentLedger(invoice));
  } catch (error) {
    console.error('Error verifying invoice ledger:', error);
    res.status(500).json({ error: 'Failed to verify invoice ledger' });
  }
};

// Write off invoice
const writeOffInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ id: req.params.id });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    invoice.status = 'WRITTEN_OFF';
    invoice.writeOffReason = req.body.reason;
    await invoice.save();
    
    res.json(invoice);
  } catch (error) {
    console.error('Error writing off invoice:', error);
    res.status(500).json({ error: 'Failed to write off invoice' });
  }
};

// Delete invoice
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ id: req.params.id });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  recordPayment,
  verifyInvoiceLedger,
  writeOffInvoice,
  deleteInvoice
};
