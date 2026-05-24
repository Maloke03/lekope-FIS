import axios from 'axios';
import API_URL from '../config/apiConfig';

export const reportService = {
  async getFinancials(month, year) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/reports/financials`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month, year }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching financial reports:', error);
      throw error;
    }
  }
};
