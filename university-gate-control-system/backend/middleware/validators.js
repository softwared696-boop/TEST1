const { validationResult } = require('express-validator');

// Validate request input
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

// Sanitize input to prevent XSS
exports.sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/[<>]/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (let key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// Rate limit handler
exports.rateLimitHandler = (req, res, next) => {
  req.on('rateLimited', () => {
    console.log(`Rate limit exceeded for IP: ${req.ip}`);
  });
  next();
};

// Error handler middleware
exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // MySQL error handling
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        return res.status(409).json({
          success: false,
          message: 'Duplicate entry. This record already exists.'
        });
      case 'ER_NO_REFERENCED_ROW_2':
        return res.status(400).json({
          success: false,
          message: 'Referenced record not found.'
        });
      case 'ER_FOREIGN_DUPLICATE_KEY':
        return res.status(400).json({
          success: false,
          message: 'Foreign key constraint violation.'
        });
      default:
        return res.status(500).json({
          success: false,
          message: 'Database error occurred.'
        });
    }
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? message : 'An error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Not found handler
exports.notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};

// Async handler wrapper
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
