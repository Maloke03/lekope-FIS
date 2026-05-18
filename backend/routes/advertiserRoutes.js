const express = require('express');
const router = express.Router();
const {
  getAdContracts,
  getAdContractById,
  createAdContract,
  updateAdContract,
  deleteAdContract
} = require('../controllers/advertiserController');
const { protect } = require('../middleware/authMiddleware');
const { canManageAdContracts, canViewAdContracts, canApproveAdContracts } = require('../middleware/roleMiddleware');

// All ad contract routes require authentication
router.use(protect);

// Routes for viewing ad contracts (finance and marketing)
router.get('/contracts', canViewAdContracts, getAdContracts);
router.get('/contracts/:id', canViewAdContracts, getAdContractById);

// Routes for creating ad contracts (only marketing)
router.post('/contracts', canManageAdContracts, createAdContract);

// Routes for updating ad contracts (marketing for edit, finance for approve)
router.put('/contracts/:id', (req, res, next) => {
  // Allow both manage and approve roles for update
  if (['STATION_MANAGER', 'MARKETING_OFFICER', 'FINANCE_OFFICER'].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
}, updateAdContract);

// Routes for deleting ad contracts (only finance, if needed)
router.delete('/contracts/:id', canApproveAdContracts, deleteAdContract);

module.exports = router;
