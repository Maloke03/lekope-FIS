import axios from 'axios';
import API_URL from '../config/apiConfig';

export const analyticsService = {
  async getOverview() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      throw error;
    }
  }
};
