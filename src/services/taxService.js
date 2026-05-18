import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const taxService = {
  // Get all tax obligations
  async getTax(status, type) {
    try {
      const token = localStorage.getItem('authToken');
      const params = {};
      if (status) params.status = status;
      if (type) params.type = type;
      
      const response = await axios.get(`${API_URL}/tax`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tax:', error);
      throw error;
    }
  },
  
  // Get tax summary
  async getTaxSummary() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/tax/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tax summary:', error);
      throw error;
    }
  },
  
  // Get regulations
  async getRegulations() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/regulations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching regulations:', error);
      throw error;
    }
  },
  
  // Update regulation status
  async updateRegulation(id, data) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/regulations/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating regulation:', error);
      throw error;
    }
  },
  
  // Create tax obligation
  async createTax(taxData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/tax`, taxData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating tax:', error);
      throw error;
    }
  },
  
  // Update tax obligation
  async updateTax(id, taxData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/tax/${id}`, taxData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating tax:', error);
      throw error;
    }
  },
  
  // Mark tax as paid
  async markAsPaid(id, paymentReference = '') {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(`${API_URL}/tax/${id}/paid`, 
        { paymentReference },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking tax as paid:', error);
      throw error;
    }
  },
  
  // Delete tax obligation
  async deleteTax(id) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.delete(`${API_URL}/tax/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting tax:', error);
      throw error;
    }
  }
};