import axios from 'axios';
import API_URL from '../config/apiConfig';

export const expenseService = {
  // Get all expenses
  async getExpenses() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },
  
  // Get expense summary
  async getExpenseSummary() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/expenses/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching expense summary:', error);
      throw error;
    }
  },
  
  // Get expense categories
  async getExpenseCategories() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/expenses/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      throw error;
    }
  },
  
  // Get monthly expenses
  async getMonthlyExpenses() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/expenses/monthly`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly expenses:', error);
      throw error;
    }
  },
  
  // Create expense
  async createExpense(expenseData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/expenses`, expenseData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  },
  
  // Update expense
  async updateExpense(id, expenseData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/expenses/${id}`, expenseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },
  
  // Delete expense
  async deleteExpense(id) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.delete(`${API_URL}/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }
};