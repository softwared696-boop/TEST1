const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const gateControlRoutes = require('./gateControl');

// Import other route modules (to be created)
// const userRoutes = require('./users');
// const visitorRoutes = require('./visitors');
// const materialRoutes = require('./materials');
// const incidentRoutes = require('./incidents');
// const reportRoutes = require('./reports');

/**
 * API Routes
 * All routes are prefixed with /api
 */

// Authentication routes
router.use('/auth', authRoutes);

// Gate Control routes
router.use('/gate', gateControlRoutes);

// User Management routes (placeholder - to be implemented)
// router.use('/users', userRoutes);

// Visitor Management routes (placeholder - to be implemented)
// router.use('/visitors', visitorRoutes);

// Materials Tracking routes (placeholder - to be implemented)
// router.use('/materials', materialRoutes);

// Incident System routes (placeholder - to be implemented)
// router.use('/incidents', incidentRoutes);

// Reports & Analytics routes (placeholder - to be implemented)
// router.use('/reports', reportRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
