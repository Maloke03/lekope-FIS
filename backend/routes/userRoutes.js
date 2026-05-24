const express = require('express');
const router = express.Router();
const { getUsers, getUser, updateUser, updateUserPassword, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { hasRole } = require('../middleware/roleMiddleware');

router.use(protect, hasRole('STATION_MANAGER'));

router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.put('/:id/password', updateUserPassword);
router.delete('/:id', deleteUser);

module.exports = router;
