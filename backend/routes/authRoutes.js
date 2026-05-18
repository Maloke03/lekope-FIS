const express = require('express');
const router = express.Router();
const { register, login, verifyToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-token', protect, verifyToken);

module.exports = router;