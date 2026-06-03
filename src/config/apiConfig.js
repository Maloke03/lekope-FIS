import axios from 'axios';
import { isBrowserOffline } from '../utils/network';

const baseUrl = process.env.REACT_APP_API_URL || 'https://lekope-fis.onrender.com';
const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
const API_URL = normalizedBaseUrl.endsWith('/api') ? normalizedBaseUrl : `${normalizedBaseUrl}/api`;

if (!axios.__lekopeOfflineInterceptor) {
  axios.interceptors.request.use(config => {
    if (isBrowserOffline()) {
      const error = new Error('Network unavailable. You appear to be offline.');
      error.isOffline = true;
      return Promise.reject(error);
    }

    return config;
  });

  axios.__lekopeOfflineInterceptor = true;
}

export default API_URL;
