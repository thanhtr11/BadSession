import axios from 'axios';

// Configure axios base URL dynamically based on current hostname
// This allows the app to work with localhost, IP addresses, and custom domains
const protocol = window.location.protocol; // http: or https:
const hostname = window.location.hostname; // localhost, IP, or domain name

// Construct API URL
let baseURL;
if (protocol === 'https:') {
  // For HTTPS, API is proxied through same domain (nginx proxy manager handles it)
  baseURL = `${protocol}//${hostname}/api`;
} else {
  // For HTTP (localhost/dev), use explicit port 9500
  baseURL = `${protocol}//${hostname}:9500/api`;
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
