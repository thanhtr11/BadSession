import axios from 'axios';

// Configure axios base URL
// If VITE_API_URL is set, use it; otherwise detect from current host
let baseURL = process.env.VITE_API_URL;

if (!baseURL) {
  // Default to localhost for development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    baseURL = 'http://localhost:9500';
  } else {
    // For custom domains, use the same hostname with API port
    baseURL = `${window.location.protocol}//${window.location.hostname}:9500`;
  }
}

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
