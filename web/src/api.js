import axios from 'axios';

// Configure axios base URL
// If VITE_API_URL is set, use it; otherwise detect from current host
let baseURL = process.env.VITE_API_URL;

if (!baseURL) {
  // Default to localhost for development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    baseURL = 'http://localhost:9500/api';
  } else {
    // For custom domains, use the same hostname with API port
    baseURL = `${window.location.protocol}//${window.location.hostname}:9500/api`;
  }
}

console.log('API Client configured with baseURL:', baseURL);

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses and errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message, error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
