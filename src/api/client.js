import axios from 'axios';

const API_BASE_URL = import.meta.env?.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('factoryflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('factoryflow_token');
      localStorage.removeItem('factoryflow_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Une erreur réseau est survenue';
    error.friendlyMessage = message;
    return Promise.reject(error);
  }
);

export default apiClient;
