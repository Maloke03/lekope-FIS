const User = require('../models/User');
const { recordAuditEntry } = require('../utils/auditLogger');

const { VALID_ROLES, normalizeRole } = User;

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get single user
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, role, isActive } = req.body;
    const normalizedRole = role ? normalizeRole(role) : undefined;
    
    if (normalizedRole && !VALID_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updates = { name, isActive };
    if (normalizedRole) updates.role = normalizedRole;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await recordAuditEntry(req, {
      status: 'SUCCESS',
      actionType: 'USER_UPDATE',
      targetType: 'USER',
      details: `Updated user ${user.email}`
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Reset user password
const updateUserPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = password;
    await user.save();

    await recordAuditEntry(req, {
      status: 'SUCCESS',
      actionType: 'USER_PASSWORD_RESET',
      targetType: 'USER',
      details: `Reset password for ${user.email}`
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await recordAuditEntry(req, {
      status: 'SUCCESS',
      actionType: 'USER_DELETE',
      targetType: 'USER',
      details: `Deleted user ${user.email}`
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

module.exports = { getUsers, getUser, updateUser, updateUserPassword, deleteUser };
