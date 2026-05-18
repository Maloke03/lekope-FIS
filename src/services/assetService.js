import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const assetService = {
  // Get all assets
  async getAssets(category, status) {
    try {
      const token = localStorage.getItem('authToken');
      const params = {};
      if (category) params.category = category;
      if (status) params.status = status;
      
      const response = await axios.get(`${API_URL}/assets`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching assets:', error);
      throw error;
    }
  },
  
  // Get asset summary
  async getAssetSummary() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/assets/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching asset summary:', error);
      throw error;
    }
  },
  
  // Create asset
  async createAsset(assetData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/assets`, assetData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating asset:', error);
      throw error;
    }
  },
  
  // Update asset
  async updateAsset(id, assetData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/assets/${id}`, assetData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
  },
  
  // Delete asset
  async deleteAsset(id) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.delete(`${API_URL}/assets/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }
  },
  
  // Calculate depreciation
  async calculateDepreciation() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/assets/calculate-depreciation`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating depreciation:', error);
      throw error;
    }
  }
};