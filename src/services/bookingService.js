import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const bookingService = {
  async getBookings() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Failed to fetch bookings';
      console.error('Error fetching bookings:', msg);
      throw new Error(msg);
    }
  },

  async createBooking(bookingData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/bookings`, bookingData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Failed to create booking';
      console.error('Error creating booking:', msg, error.response?.data);
      throw new Error(msg);
    }
  },

  // Airtime
  async getAirtimes() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/bookings/airtime`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Failed to fetch airtimes';
      console.error('Error fetching airtimes:', msg);
      throw new Error(msg);
    }
  },

  async createAirtime(airtimeData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/bookings/airtime`, airtimeData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Failed to create airtime';
      console.error('Error creating airtime:', msg, error.response?.data);
      throw new Error(msg);
    }
  },

  async updateAirtime(id, airtimeData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/bookings/airtime/${id}`, airtimeData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Failed to update airtime';
      console.error('Error updating airtime:', msg, error.response?.data);
      throw new Error(msg);
    }
  },

  async deleteAirtime(id) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.delete(`${API_URL}/bookings/airtime/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Failed to delete airtime';
      console.error('Error deleting airtime:', msg, error.response?.data);
      throw new Error(msg);
    }
  }
};
