import axios from 'axios';
import API_URL from '../config/apiConfig';

export const auditService = {
  async getLoginHistory() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/login-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching login history:', error);
      throw error;
    }
  }
};
