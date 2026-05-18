const express = require('express');
const router = express.Router();
const {
  getAirtimes,
  getAirtimeById,
  createAirtime,
  updateAirtime,
  deleteAirtime
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { canManageAdContracts, canViewAdContracts, canApproveAdContracts } = require('../middleware/roleMiddleware'); // Reuse for airtime

// All airtime routes require authentication
router.use(protect);

// Routes for viewing airtime (finance and marketing)
router.get('/airtime', canViewAdContracts, getAirtimes);
router.get('/airtime/:id', canViewAdContracts, getAirtimeById);

// Routes for creating airtime (only marketing)
router.post('/airtime', canManageAdContracts, createAirtime);

// Routes for updating airtime (marketing for edit, finance for approve)
router.put('/airtime/:id', (req, res, next) => {
  // Allow both manage and approve roles for update
  if (['STATION_MANAGER', 'MARKETING_OFFICER', 'FINANCE_OFFICER'].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
}, updateAirtime);

// Routes for deleting airtime (only finance, if needed)
router.delete('/airtime/:id', canApproveAdContracts, deleteAirtime);

module.exports = router;
