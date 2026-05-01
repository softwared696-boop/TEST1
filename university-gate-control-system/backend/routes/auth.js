const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authService = require('../services/authService');
const { verifyToken } = require('../middleware/auth');
const { validate, sanitizeInput, asyncHandler } = require('../middleware/validators');

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('department').optional().trim(),
  body('studentId').optional().trim(),
  body('staffId').optional().trim()
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
];

const resetPasswordValidation = [
  body('resetToken').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number')
];

// Routes

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  sanitizeInput,
  registerValidation, 
  validate,
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        userId: result.userId,
        verificationRequired: true
      }
    });
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  sanitizeInput,
  loginValidation,
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout',
  verifyToken,
  asyncHandler(async (req, res) => {
    const result = await authService.logout(req.user.id);
    res.json({
      success: true,
      message: result.message
    });
  })
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password',
  sanitizeInput,
  forgotPasswordValidation,
  validate,
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    
    res.json({
      success: true,
      message: result.message,
      ...(result.resetToken && { resetToken: result.resetToken })
    });
  })
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password',
  sanitizeInput,
  resetPasswordValidation,
  validate,
  asyncHandler(async (req, res) => {
    const { resetToken, newPassword } = req.body;
    const result = await authService.resetPassword(resetToken, newPassword);
    
    res.json({
      success: true,
      message: result.message
    });
  })
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password for logged-in user
 * @access  Private
 */
router.put('/change-password',
  verifyToken,
  sanitizeInput,
  changePasswordValidation,
  validate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: result.message
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me',
  verifyToken,
  asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(req.user.id);
    
    res.json({
      success: true,
      data: profile
    });
  })
);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get('/verify-email/:token',
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const result = await authService.verifyEmail(token);
    
    res.json({
      success: true,
      message: result.message
    });
  })
);

module.exports = router;
