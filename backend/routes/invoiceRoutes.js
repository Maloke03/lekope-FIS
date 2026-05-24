const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  recordPayment,
  verifyInvoiceLedger,
  anchorInvoiceLedger,
  writeOffInvoice,
  deleteInvoice
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');
const { canManageInvoices, canViewInvoices, canApproveInvoices, canDeleteInvoices } = require('../middleware/roleMiddleware');

// All invoice routes require authentication
router.use(protect);

// Routes for viewing invoices (finance and marketing)
router.get('/', canViewInvoices, getInvoices);
router.get('/:id/ledger/verify', canViewInvoices, verifyInvoiceLedger);
router.get('/:id', canViewInvoices, getInvoiceById);

// Routes for creating invoices (only marketing)
router.post('/', canManageInvoices, createInvoice);

// Routes for updating invoices (marketing for edit, finance for approve)
router.put('/:id', (req, res, next) => {
  // Allow both manage and approve roles for update
  if (['STATION_MANAGER', 'MARKETING_OFFICER', 'FINANCE_OFFICER'].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
}, updateInvoice);

// Routes for recording payments and write-off (finance for approve actions)
router.post('/:id/ledger/anchor', canApproveInvoices, anchorInvoiceLedger);
router.post('/:id/payments', canApproveInvoices, recordPayment);
router.post('/:id/writeoff', canApproveInvoices, writeOffInvoice);

// Routes for deleting invoices (only finance)
router.delete('/:id', canDeleteInvoices, deleteInvoice);

module.exports = router;
