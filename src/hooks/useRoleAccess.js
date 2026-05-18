import { useAuth } from '../contexts/AuthContext';

export const useRoleAccess = () => {
  const { user, hasRole, canAccessPage } = useAuth();

  return {
    user,
    isFinanceOfficer: () => hasRole('FINANCE_OFFICER'),
    isMarketingOfficer: () => hasRole('MARKETING_OFFICER'),
    isStationManager: () => user?.role === 'STATION_MANAGER',
    isStaff: () => hasRole('STAFF'),
    isAuditor: () => user?.role === 'AUDITOR',
    canAccessPage,
    getRoleName: () => {
      const roleNames = {
        FINANCE_OFFICER: 'Finance Officer',
        MARKETING_OFFICER: 'Marketing Officer',
        STATION_MANAGER: 'Station Manager',
        STAFF: 'Staff Member',
        AUDITOR: 'Auditor'
      };
      return user ? roleNames[user.role] : '';
    }
  };
};
