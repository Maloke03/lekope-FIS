const LoginHistory = require('../models/LoginHistory');

const recordAuditEntry = async (req, { status = 'INFO', actionType = 'SYSTEM', targetType = 'GENERAL', details = '', reason = '' } = {}) => {
  try {
    await LoginHistory.create({
      user: req.user?._id,
      name: req.user?.name,
      email: req.user?.email,
      role: req.user?.role,
      status,
      actionType,
      targetType,
      details,
      reason,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
  } catch (error) {
    console.error('Failed to record audit entry:', error);
  }
};

module.exports = { recordAuditEntry };