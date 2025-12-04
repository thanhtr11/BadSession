/**
 * Application-wide constants
 * Centralized location for all magic strings and configuration values
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:9500/api',
  TIMEOUT: 10000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'Admin',
  PLAYER: 'Player',
  GUEST: 'Guest'
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500
};

// Application Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SESSIONS: '/sessions',
  CALENDAR: '/calendar',
  PLAYERS: '/players',
  GUESTS: '/guests',
  FINANCE: '/finance',
  ADMIN: '/admin'
};

// Color Scheme
export const COLORS = {
  PRIMARY_TEAL: '#17a2b8',
  DARK_TEAL: '#138496',
  LIGHT_TEAL: '#d4f5f8',
  CHARCOAL: '#2c3e50',
  LIGHT_GRAY: '#ecf0f1',
  BORDER_COLOR: '#bdc3c7',
  SUCCESS: '#27ae60',
  DANGER: '#e74c3c',
  WARNING: '#f39c12',
  INFO: '#3498db'
};

// Toast/Alert Messages
export const MESSAGES = {
  LOADING: 'Loading...',
  ERROR_GENERIC: 'An error occurred. Please try again.',
  ERROR_NETWORK: 'Network error. Please check your connection.',
  ERROR_UNAUTHORIZED: 'You are not authorized to perform this action.',
  ERROR_NOT_FOUND: 'The requested resource was not found.',
  SUCCESS_CREATED: 'Item created successfully.',
  SUCCESS_UPDATED: 'Item updated successfully.',
  SUCCESS_DELETED: 'Item deleted successfully.',
  SUCCESS_LOGIN: 'Login successful!',
  ERROR_LOGIN: 'Invalid username or password.',
  CONFIRM_DELETE: 'Are you sure you want to delete this item?',
  CONFIRM_LOGOUT: 'Are you sure you want to logout?',
  NO_DATA: 'No data available.',
  LOADING_PLAYERS: 'Loading players...',
  LOADING_GUESTS: 'Loading guests...',
  LOADING_SESSIONS: 'Loading sessions...'
};

// Session Status
export const SESSION_STATUS = {
  SCHEDULED: 'scheduled',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Finance Categories
export const FINANCE_CATEGORIES = {
  DONATION: 'donation',
  EXPENSE: 'expense',
  INCOME: 'income',
  REGISTRATION: 'registration'
};

// Date & Time Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  ISO: 'YYYY-MM-DD',
  TIME: 'HH:mm',
  DATETIME: 'DD/MM/YYYY HH:mm'
};

// Pagination
export const PAGINATION = {
  PAGE_SIZE: 10,
  DEFAULT_PAGE: 1
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  PREFERENCES: 'preferences'
};

// Validation Rules
export const VALIDATION_RULES = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PATTERN: /^[0-9]{10,15}$/
};

// Debounce & Throttle Delays (in ms)
export const DELAYS = {
  SEARCH_DEBOUNCE: 300,
  API_THROTTLE: 500,
  ANIMATION: 300,
  NOTIFICATION_DURATION: 3000
};

// Icons (Emoji)
export const ICONS = {
  LOADING: '⏳',
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  LOGOUT: '🚪',
  DASHBOARD: '📊',
  CALENDAR: '📅',
  SESSIONS: '🏸',
  PLAYERS: '👥',
  GUESTS: '👤',
  FINANCE: '💰',
  ADMIN: '⚙️',
  HOME: '🏠',
  ADD: '➕',
  EDIT: '✏️',
  DELETE: '🗑️',
  SEARCH: '🔍',
  FILTER: '🔽',
  SORT: '↕️'
};

// API Endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout'
  },
  USERS: {
    LIST: '/users',
    GET: (id) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`
  },
  SESSIONS: {
    LIST: '/sessions',
    GET: (id) => `/sessions/${id}`,
    CREATE: '/sessions',
    UPDATE: (id) => `/sessions/${id}`,
    DELETE: (id) => `/sessions/${id}`
  },
  ATTENDANCE: {
    LIST: '/attendance',
    CHECK_IN: '/attendance/check-in',
    CHECK_OUT: (id) => `/attendance/${id}`
  },
  FINANCE: {
    DONATIONS: '/finance/donations',
    EXPENSES: '/finance/expenses',
    SETTINGS: '/finance/settings'
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
    OVERVIEW: '/dashboard/overview'
  }
};

// Default Values
export const DEFAULTS = {
  CURRENCY: 'VND',
  LANGUAGE: 'en',
  THEME: 'light',
  ITEMS_PER_PAGE: 10
};

// Feature Flags
export const FEATURES = {
  ENABLE_NOTIFICATIONS: true,
  ENABLE_DARK_MODE: false,
  ENABLE_EXPORT: true,
  ENABLE_IMPORT: false,
  ENABLE_ANALYTICS: false,
  DEBUG_MODE: import.meta.env.DEV
};

export default {
  API_CONFIG,
  USER_ROLES,
  HTTP_STATUS,
  ROUTES,
  COLORS,
  MESSAGES,
  SESSION_STATUS,
  FINANCE_CATEGORIES,
  DATE_FORMATS,
  PAGINATION,
  STORAGE_KEYS,
  VALIDATION_RULES,
  DELAYS,
  ICONS,
  ENDPOINTS,
  DEFAULTS,
  FEATURES
};
