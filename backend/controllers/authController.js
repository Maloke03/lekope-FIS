const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { recordAuditEntry } = require('../utils/auditLogger');

const { VALID_ROLES, normalizeRole } = User;

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const normalizedRole = normalizeRole(role);
    if (!VALID_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const user = new User({ name, email, password, role: normalizedRole });
    await user.save();
    await recordAuditEntry(req, {
      status: 'SUCCESS',
      actionType: 'USER_REGISTER',
      targetType: 'USER',
      details: `Registered new user ${email}`
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      await recordAuditEntry(req, { status: 'FAILED', actionType: 'LOGIN', targetType: 'AUTH', reason: 'User not found' });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      await recordAuditEntry(req, { user, status: 'FAILED', actionType: 'LOGIN', targetType: 'AUTH', reason: 'Account is deactivated' });
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      await recordAuditEntry(req, { user, status: 'FAILED', actionType: 'LOGIN', targetType: 'AUTH', reason: 'Invalid password' });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    user.role = normalizeRole(user.role);
    await user.save();
    await recordAuditEntry(req, { user, status: 'SUCCESS', actionType: 'LOGIN', targetType: 'AUTH', details: `User ${user.email} logged in` });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Verify token
const verifyToken = async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { register, login, verifyToken };
