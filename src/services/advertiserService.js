import axios from 'axios';
import API_URL from '../config/apiConfig';

export const advertiserService = {
  async getAdvertisers() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/advertisers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Failed to fetch advertisers';
      console.error('Error fetching advertisers:', msg);
      throw new Error(msg);
    }
  },

  async createAdvertiser(advertiserData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/advertisers`, advertiserData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Failed to create advertiser';
      console.error('Error creating advertiser:', msg, error.response?.data);
      throw new Error(msg);
    }
  },

  // Ad Contracts
  async getAdContracts() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/advertisers/contracts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Failed to fetch ad contracts';
      console.error('Error fetching ad contracts:', msg);
      throw new Error(msg);
    }
  },

  async createAdContract(contractData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/advertisers/contracts`, contractData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Failed to create ad contract';
      console.error('Error creating ad contract:', msg, error.response?.data);
      throw new Error(msg);
    }
  },

  async updateAdContract(id, contractData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/advertisers/contracts/${id}`, contractData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Failed to update ad contract';
      console.error('Error updating ad contract:', msg, error.response?.data);
      throw new Error(msg);
    }
  },

  async deleteAdContract(id) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.delete(`${API_URL}/advertisers/contracts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Failed to delete ad contract';
      console.error('Error deleting ad contract:', msg, error.response?.data);
      throw new Error(msg);
    }
  }
};
