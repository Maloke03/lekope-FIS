import axios from 'axios';
import API_URL from '../config/apiConfig';

export const invoiceService = {
  // Get all invoices
  async getInvoices() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },
  
  // Create new invoice
  async createInvoice(invoiceData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/invoices`, invoiceData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },
  
  // Update invoice
  async updateInvoice(id, invoiceData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_URL}/invoices/${id}`, invoiceData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  },
  
  // Record payment
  async recordPayment(id, paymentData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/invoices/${id}/payments`, paymentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  },

  // Verify blockchain-style payment ledger
  async verifyLedger(id) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/invoices/${id}/ledger/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying invoice ledger:', error);
      throw error;
    }
  },

  // Anchor the verified ledger tip to the configured public testnet
  async anchorLedger(id) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/invoices/${id}/ledger/anchor`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error anchoring invoice ledger:', error);
      throw error;
    }
  },
  
  // Mark as write-off
  async writeOff(id, reason) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/invoices/${id}/writeoff`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error writing off invoice:', error);
      throw error;
    }
  },

  // Delete invoice
  async deleteInvoice(id) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.delete(`${API_URL}/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  },
  
  // Send invoice via email
  async sendViaEmail(id, emailData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`${API_URL}/invoices/${id}/send-email`, emailData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },
  
  // Generate PDF and get download URL
  async downloadPDF(id) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }
};
