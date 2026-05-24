import axios from 'axios';
import API_URL from '../config/apiConfig';

export const rateCardService = {
  async getRates() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/rate-card`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching rate card:', error);
      throw error;
    }
  },

  async createRate(rateData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/rate-card`, rateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating rate card item:', error);
      throw error;
    }
  },

  async updateRate(id, rateData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/rate-card/${id}`, rateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating rate card item:', error);
      throw error;
    }
  },

  async deleteRate(id) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.delete(`${API_URL}/rate-card/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting rate card item:', error);
      throw error;
    }
  }
};
