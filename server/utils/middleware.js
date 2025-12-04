/**
 * Error Handler Middleware
 * Centralized error handling for all API routes
 * Formats errors consistently and logs appropriately
 */

const { APIError } = require('../utils/errors');
const { LOG_LEVELS } = require('../config/constants');

/**
 * Main error handler middleware
 * Should be added as the last middleware in Express
 */
const errorHandler = (err, req, res, next) => {
  // Log error details
  logError(err, req);

  // Determine status code and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Handle specific error types
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = err.details;
  } else if (err.name === 'DatabaseError') {
    statusCode = 500;
    message = 'Database error occurred';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      details,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Error logger
 * Logs errors with appropriate details
 */
const logError = (err, req) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    level: LOG_LEVELS.ERROR,
    error: {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode || 500
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: sanitizeBody(req.body),
      ip: req.ip,
      user: req.user?.id || 'anonymous'
    }
  };

  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 API Error:', JSON.stringify(errorLog, null, 2));
  } else {
    console.error('API Error:', errorLog);
  }
};

/**
 * Sanitize request body for logging
 * Removes sensitive fields like passwords
 */
const sanitizeBody = (body) => {
  if (!body) return null;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

  sensitiveFields.forEach((field) => {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***';
    }
  });

  return sanitized;
};

/**
 * 404 Not Found Handler
 * Should be added after all other routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new APIError(`Route not found: ${req.method} ${req.path}`, 404);
  next(error);
};

/**
 * Validation middleware factory
 * Creates a middleware that validates request against a schema
 */
const validateRequest = (schema, source = 'body') => {
  return asyncHandler(async (req, res, next) => {
    try {
      const data = req[source];
      await schema.validate(data, { abortEarly: false });
      next();
    } catch (err) {
      const { ValidationError } = require('../utils/errors');
      const errors = err.inner.reduce((acc, error) => {
        acc[error.path] = error.message;
        return acc;
      }, {});
      throw new ValidationError('Validation failed', errors);
    }
  });
};

module.exports = {
  errorHandler,
  asyncHandler,
  logError,
  notFoundHandler,
  validateRequest,
  sanitizeBody
};
