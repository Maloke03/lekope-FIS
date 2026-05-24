import axios from 'axios';
import API_URL from '../config/apiConfig';

export const budgetService = {
  async getBudgetSummary() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/budget/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching budget summary:', error);
      throw error;
    }
  }
};
