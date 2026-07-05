const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/receipts
 * @desc    Create a new receipt
 * @access  Public
 */
router.patch('/:id/pay', protect, authorize('admin', 'manager','cashier'), receiptController.payReceipt);


module.exports = router;
