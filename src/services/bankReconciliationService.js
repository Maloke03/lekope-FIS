import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const bankReconciliationService = {
  async getEntries() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/bank-reconciliation`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching bank reconciliation entries:', error);
      throw error;
    }
  },

  async createEntry(entryData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/bank-reconciliation`, entryData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating bank reconciliation entry:', error);
      throw error;
    }
  },

  async updateEntry(id, entryData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/bank-reconciliation/${id}`, entryData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating bank reconciliation entry:', error);
      throw error;
    }
  },

  async deleteEntry(id) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.delete(`${API_URL}/bank-reconciliation/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting bank reconciliation entry:', error);
      throw error;
    }
  }
};
