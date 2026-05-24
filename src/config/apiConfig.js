const baseUrl = process.env.REACT_APP_API_URL || 'https://lekope-fis.onrender.com';
const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
const API_URL = normalizedBaseUrl.endsWith('/api') ? normalizedBaseUrl : `${normalizedBaseUrl}/api`;

export default API_URL;
