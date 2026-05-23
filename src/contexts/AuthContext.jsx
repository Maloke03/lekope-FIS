import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// API URL - Change this to your deployed backend URL
const API_URL = 'https://lekope-fis.onrender.com/api';

export const ROLES = {
  STATION_MANAGER: 'STATION_MANAGER',
  FINANCE_OFFICER: 'FINANCE_OFFICER',
  MARKETING_OFFICER: 'MARKETING_OFFICER',
  STAFF: 'STAFF',
  AUDITOR: 'AUDITOR'
};

// Role hierarchy for access control
const ROLE_HIERARCHY = {
  [ROLES.FINANCE_OFFICER]: [ROLES.FINANCE_OFFICER, ROLES.MARKETING_OFFICER, ROLES.STATION_MANAGER, ROLES.STAFF, ROLES.AUDITOR],
  [ROLES.AUDITOR]: [ROLES.AUDITOR],
  [ROLES.MARKETING_OFFICER]: [ROLES.MARKETING_OFFICER, ROLES.STAFF],
  [ROLES.STATION_MANAGER]: [ROLES.STATION_MANAGER, ROLES.FINANCE_OFFICER, ROLES.MARKETING_OFFICER, ROLES.STAFF],
  [ROLES.STAFF]: [ROLES.STAFF]
};

// Page access permissions based on roles
export const PAGE_ACCESS = {
  '/': [ROLES.STATION_MANAGER, ROLES.FINANCE_OFFICER, ROLES.AUDITOR],
  '/dashboard': [ROLES.STATION_MANAGER, ROLES.FINANCE_OFFICER, ROLES.AUDITOR],
  '/revenue': [ROLES.STATION_MANAGER, ROLES.FINANCE_OFFICER, ROLES.AUDITOR],
  '/expenses': [ROLES.STATION_MANAGER, ROLES.FINANCE_OFFICER, ROLES.AUDITOR],
  '/invoices': [ROLES.STATION_MANAGER, ROLES.FINANCE_OFFICER, ROLES.MARKETING_OFFICER, ROLES.AUDITOR],
  '/budget': [ROLES.STATION_MANAGER, ROLES.FINANCE_OFFICER, ROLES.AUDITOR],
  '/adcontracts': [ROLES.STATION_MANAGER, ROLES.MARKETING_OFFICER, ROLES.AUDITOR],
  '/advertisers': [ROLES.STATION_MANAGER, ROLES.MARKETING_OFFICER, ROLES.AUDITOR],
  '/bookings': [ROLES.STATION_MANAGER, ROLES.MARKETING_OFFICER, ROLES.AUDITOR],
  '/payroll': [ROLES.STATION_MANAGER, ROLES.FINANCE_OFFICER, ROLES.STAFF, ROLES.AUDITOR],
  '/tax': [ROLES.STATION_MANAGER, ROLES.FINANCE_OFFICER, ROLES.AUDITOR],
  '/assets': [ROLES.STATION_MANAGER, ROLES.FINANCE_OFFICER, ROLES.AUDITOR],
  '/bank-reconciliation': [ROLES.STATION_MANAGER, ROLES.FINANCE_OFFICER, ROLES.AUDITOR],
  '/reports': [ROLES.FINANCE_OFFICER, ROLES.STATION_MANAGER, ROLES.AUDITOR],
  '/analytics': [ROLES.STATION_MANAGER, ROLES.FINANCE_OFFICER, ROLES.AUDITOR]
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]); // For admin user management

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Verify token with backend
  const verifyToken = async (token) => {
    try {
      const response = await axios.post(`${API_URL}/verify-token`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (err) {
      console.error('Token verification failed:', err);
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (userData) => {
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/register`, userData);
      
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Login user
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  // Fetch all users (admin only)
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch users:', err);
      return [];
    }
  };

  // Update user (admin only)
  const updateUser = async (userId, userData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/users/${userId}`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh user list
      await fetchUsers();
      return { success: true, user: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update user';
      return { success: false, error: errorMessage };
    }
  };

  // Delete user (admin only)
  const deleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh user list
      await fetchUsers();
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to delete user';
      return { success: false, error: errorMessage };
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    if (!user) return false;
    const allowedRoles = ROLE_HIERARCHY[user.role] || [];
    return allowedRoles.includes(role);
  };

  // Check if user can access page
  const canAccessPage = (path) => {
    if (!user) return false;
    const allowedRoles = PAGE_ACCESS[path] || [];
    return user.role === ROLES.STATION_MANAGER || allowedRoles.includes(user.role);
  };

  // Get user role display name
  const getRoleDisplayName = (role) => {
    const roleNames = {
      [ROLES.FINANCE_OFFICER]: 'Finance Officer',
      [ROLES.MARKETING_OFFICER]: 'Marketing Officer',
      [ROLES.STATION_MANAGER]: 'Station Manager',
      [ROLES.STAFF]: 'Staff Member',
      [ROLES.AUDITOR]: 'Auditor'
    };
    return roleNames[role] || role;
  };

  // Check if user is admin (has full access)
  const isAdmin = () => {
    return user?.role === ROLES.STATION_MANAGER || user?.role === ROLES.FINANCE_OFFICER || user?.role === ROLES.AUDITOR;
  };

  const value = {
    user,
    users,
    loading,
    error,
    login,
    register,
    logout,
    fetchUsers,
    updateUser,
    deleteUser,
    hasRole,
    canAccessPage,
    getRoleDisplayName,
    isAdmin,
    isAuthenticated: !!user,
    ROLES
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
