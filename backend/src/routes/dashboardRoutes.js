const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/dashboard/summary
 * @desc    Aggregate counts for the Admin Dashboard KPI cards
 * @access  Protected — admin, manager
 */
router.get('/summary', protect, authorize('admin', 'manager'), dashboardController.getSummary);

module.exports = router;
