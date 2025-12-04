/**
 * Backend Constants
 * Centralized configuration and constants for the API
 */

// User Roles
const USER_ROLES = {
  ADMIN: 'Admin',
  PLAYER: 'Player'
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500
};

// Success Messages
const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  LOGIN: 'Login successful',
  LOGOUT: 'Logout successful'
};

// Error Messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized - invalid credentials',
  FORBIDDEN: 'Forbidden - insufficient permissions',
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Bad request - invalid input',
  CONFLICT: 'Conflict - resource already exists',
  SERVER_ERROR: 'Internal server error',
  DB_ERROR: 'Database error occurred',
  VALIDATION_ERROR: 'Validation error - check input data'
};

// Database Constants
const DB_CONFIG = {
  WAIT_FOR_CONNECTIONS: true,
  CONNECTION_LIMIT: 10,
  QUEUE_LIMIT: 0,
  ENABLE_KEEP_ALIVE: true,
  KEEP_ALIVE_INITIAL_DELAY_MS: 0
};

// JWT Constants
const JWT_CONFIG = {
  ALGORITHM: 'HS256',
  EXPIRATION: '24h',
  EXPIRATION_SECONDS: 86400 // 24 hours
};

// Validation Rules
const VALIDATION_RULES = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PATTERN: /^[0-9]{10,15}$/
};

// Pagination
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
};

// Date Formats
const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  ISO_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DISPLAY: 'DD/MM/YYYY'
};

// Cache Duration (in seconds)
const CACHE_DURATION = {
  SHORT: 60,          // 1 minute
  MEDIUM: 300,        // 5 minutes
  LONG: 3600,         // 1 hour
  VERY_LONG: 86400    // 24 hours
};

// Rate Limiting
const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100
};

// Finance Categories
const FINANCE_CATEGORIES = {
  DONATION: 'donation',
  EXPENSE: 'expense',
  INCOME: 'income',
  REGISTRATION: 'registration'
};

// Session Status
const SESSION_STATUS = {
  SCHEDULED: 'scheduled',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Default Values
const DEFAULTS = {
  LANGUAGE: 'en',
  CURRENCY: 'VND',
  TIMEZONE: 'UTC'
};

// API Endpoints (for reference)
const API_ENDPOINTS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  SESSIONS: '/api/sessions',
  ATTENDANCE: '/api/attendance',
  FINANCE: '/api/finance',
  DASHBOARD: '/api/dashboard',
  HEALTH: '/api/health'
};

// Logging Levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  TRACE: 'TRACE'
};

// Feature Flags
const FEATURES = {
  ENABLE_LOGGING: true,
  ENABLE_CACHING: true,
  ENABLE_RATE_LIMITING: false,
  ENABLE_API_DOCS: true,
  DEBUG_MODE: process.env.NODE_ENV !== 'production'
};

module.exports = {
  USER_ROLES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  DB_CONFIG,
  JWT_CONFIG,
  VALIDATION_RULES,
  PAGINATION,
  DATE_FORMATS,
  CACHE_DURATION,
  RATE_LIMIT,
  FINANCE_CATEGORIES,
  SESSION_STATUS,
  DEFAULTS,
  API_ENDPOINTS,
  LOG_LEVELS,
  FEATURES
};
