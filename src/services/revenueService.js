import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const revenueService = {
  // Get all revenue transactions
  async getRevenue() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/revenue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue:', error);
      throw error;
    }
  },
  
  // Get revenue summary (KPIs)
  async getRevenueSummary() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/revenue/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue summary:', error);
      throw error;
    }
  },
  
  // Get revenue streams
  async getRevenueStreams() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/revenue/streams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue streams:', error);
      throw error;
    }
  },
  
  // Get monthly revenue data
  async getMonthlyRevenue() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/revenue/monthly`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      throw error;
    }
  },
  
  // Create new revenue transaction
  async createRevenue(revenueData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/revenue`, revenueData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating revenue:', error);
      throw error;
    }
  },
  
  // Update revenue transaction
  async updateRevenue(id, revenueData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/revenue/${id}`, revenueData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating revenue:', error);
      throw error;
    }
  },
  
  // Delete revenue transaction
  async deleteRevenue(id) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.delete(`${API_URL}/revenue/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting revenue:', error);
      throw error;
    }
  }
};