import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const payrollService = {
  // Get all payroll records for current month
  async getPayroll(month, year) {
    try {
      const token = localStorage.getItem('authToken');
      const params = {};
      if (month) params.month = month;
      if (year) params.year = year;
      
      const response = await axios.get(`${API_URL}/payroll`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching payroll:', error);
      throw error;
    }
  },
  
  // Get payroll summary
  async getPayrollSummary() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/payroll/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching payroll summary:', error);
      throw error;
    }
  },
  
  // Get available payroll months
  async getPayrollMonths() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/payroll/months`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching payroll months:', error);
      throw error;
    }
  },
  
  // Create payroll record
  async createPayroll(payrollData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/payroll`, payrollData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payroll:', error);
      throw error;
    }
  },
  
  // Update payroll record
  async updatePayroll(id, payrollData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/payroll/${id}`, payrollData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating payroll:', error);
      throw error;
    }
  },
  
  // Update payroll status
  async updateStatus(id, status, paymentReference = '') {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(`${API_URL}/payroll/${id}/status`, 
        { status, paymentReference },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  },
  
  // Mark all as paid
  async markAllAsPaid() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/payroll/mark-all-paid`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error marking all as paid:', error);
      throw error;
    }
  },
  
  // Delete payroll record
  async deletePayroll(id) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.delete(`${API_URL}/payroll/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting payroll:', error);
      throw error;
    }
  }
};