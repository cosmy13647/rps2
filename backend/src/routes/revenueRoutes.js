const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenueController');

/**
 * @route   GET /api/revenue/today
 * @desc    Get total revenue and paid receipts count for today
 * @access  Public
 */
router.get('/today', revenueController.getTodayRevenue);

module.exports = router;
