const express = require('express');
const { body, query: queryValidator } = require('express-validator');
const router = express.Router();
const gateControlService = require('../services/gateControlService');
const { verifyToken, hasPermission } = require('../middleware/auth');
const { validate, sanitizeInput, asyncHandler } = require('../middleware/validators');

// Validation rules
const recordGateLogValidation = [
  body('entryType').isIn(['ENTRY', 'EXIT']).withMessage('Entry type must be ENTRY or EXIT'),
  body('gateNumber').trim().notEmpty().withMessage('Gate number is required'),
  body('purpose').optional().trim(),
  body('vehicleNumber').optional().trim(),
  body('inspectionStatus').optional().isIn(['PENDING', 'APPROVED', 'DENIED', 'INSPECTED']),
  body('inspectionNotes').optional().trim(),
  body('qrCode').optional().trim(),
  body('studentId').optional().trim(),
  body('staffId').optional().trim(),
  body('visitorId').optional().isInt({ min: 1 }).withMessage('Invalid visitor ID')
];

const updateInspectionValidation = [
  body('status').isIn(['PENDING', 'APPROVED', 'DENIED', 'INSPECTED']).withMessage('Invalid status'),
  body('notes').optional().trim()
];

// Routes

/**
 * @route   POST /api/gate/log
 * @desc    Record entry/exit at gate
 * @access  Private (Gate Officer, Admin, Main Admin)
 */
router.post('/log',
  verifyToken,
  hasPermission('gate_entry_allow'),
  sanitizeInput,
  recordGateLogValidation,
  validate,
  asyncHandler(async (req, res) => {
    const result = await gateControlService.recordGateLog(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: result.message,
      data: { logId: result.logId }
    });
  })
);

/**
 * @route   GET /api/gate/logs
 * @desc    Get all gate logs with filtering and pagination
 * @access  Private
 */
router.get('/logs',
  verifyToken,
  hasPermission('gate_log_view'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, entryType, gateNumber, startDate, endDate, inspectionStatus } = req.query;
    
    const filters = {
      entryType,
      gateNumber,
      startDate,
      endDate,
      inspectionStatus
    };

    const result = await gateControlService.getGateLogs(filters, parseInt(page), parseInt(limit));
    
    res.json({
      success: true,
      ...result
    });
  })
);

/**
 * @route   GET /api/gate/logs/:id
 * @desc    Get single gate log details
 * @access  Private
 */
router.get('/logs/:id',
  verifyToken,
  hasPermission('gate_log_view'),
  asyncHandler(async (req, res) => {
    const log = await gateControlService.getGateLogById(req.params.id);
    
    res.json({
      success: true,
      data: log
    });
  })
);

/**
 * @route   PUT /api/gate/logs/:id/inspection
 * @desc    Update inspection status
 * @access  Private (Gate Officer, Admin, Main Admin)
 */
router.put('/logs/:id/inspection',
  verifyToken,
  hasPermission('gate_inspection'),
  sanitizeInput,
  updateInspectionValidation,
  validate,
  asyncHandler(async (req, res) => {
    const { status, notes } = req.body;
    const result = await gateControlService.updateInspectionStatus(
      req.params.id,
      status,
      notes,
      req.user.id
    );
    
    res.json({
      success: true,
      message: result.message
    });
  })
);

/**
 * @route   GET /api/gate/stats/today
 * @desc    Get today's gate statistics
 * @access  Private
 */
router.get('/stats/today',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { gateNumber } = req.query;
    const stats = await gateControlService.getTodayStats(gateNumber);
    
    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * @route   GET /api/gate/activity/recent
 * @desc    Get recent gate activity
 * @access  Private
 */
router.get('/activity/recent',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const activity = await gateControlService.getRecentActivity(parseInt(limit));
    
    res.json({
      success: true,
      data: activity
    });
  })
);

module.exports = router;
