/**
 * API Service
 * Wrapper around axios with common request/response handling
 * Located in services folder for backend-like organization
 */

import axios from 'axios';
import { API_CONFIG } from '../config/constants';

// Configure axios base URL dynamically based on current hostname
const protocol = window.location.protocol;
const hostname = window.location.hostname;

// Construct API URL
let baseURL;
if (protocol === 'https:') {
  // For HTTPS, API is proxied through same domain
  baseURL = `${protocol}//${hostname}/api`;
} else {
  // For HTTP (localhost/dev), use explicit port 9500
  baseURL = `${protocol}//${hostname}:9500/api`;
}

console.log('API Service configured with baseURL:', baseURL);

// Create axios instance
const apiClient = axios.create({
  baseURL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Request Interceptor
 * - Adds JWT token to all requests
 * - Can be extended for logging, request transformation, etc.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * - Handles errors and redirects to login if unauthorized
 * - Can be extended for response transformation, retry logic, etc.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    console.error('API Error:', {
      status,
      message: error.message,
      data
    });

    // Handle 401 Unauthorized - redirect to login
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Return formatted error for consistency
    return Promise.reject({
      status,
      message: data?.message || error.message,
      data
    });
  }
);

export default apiClient;
