// Check if user has specific role
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.user.role === 'STATION_MANAGER') {
      return next();
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    
    next();
  };
};

// Check if user is finance officer or auditor
const isFinanceManager = hasRole('STATION_MANAGER', 'FINANCE_OFFICER', 'AUDITOR');

// Check if user can manage invoices (full CRUD)
const canManageInvoices = hasRole('STATION_MANAGER', 'FINANCE_OFFICER', 'MARKETING_OFFICER');

// Check if user can view invoices
const canViewInvoices = hasRole('STATION_MANAGER', 'FINANCE_OFFICER', 'MARKETING_OFFICER', 'AUDITOR');

// Check if user can approve invoices (update status)
const canApproveInvoices = hasRole('STATION_MANAGER', 'FINANCE_OFFICER');

// Check if user can delete invoices
const canDeleteInvoices = hasRole('STATION_MANAGER', 'FINANCE_OFFICER');

// Check if user can view reports
const canViewReports = hasRole('FINANCE_OFFICER', 'STATION_MANAGER', 'AUDITOR');

// Check if user can view ad contracts and airtime
const canViewAdContracts = hasRole('STATION_MANAGER', 'FINANCE_OFFICER', 'MARKETING_OFFICER', 'AUDITOR');

// Check if user can approve ad contracts and airtime
const canApproveAdContracts = hasRole('STATION_MANAGER', 'FINANCE_OFFICER');

// Check if user can manage ad contracts and airtime (full CRUD)
const canManageAdContracts = hasRole('STATION_MANAGER', 'MARKETING_OFFICER');

module.exports = { 
  hasRole, 
  isFinanceManager, 
  canManageInvoices, 
  canViewInvoices, 
  canApproveInvoices, 
  canDeleteInvoices, 
  canViewReports, 
  canViewAdContracts, 
  canApproveAdContracts, 
  canManageAdContracts 
};
