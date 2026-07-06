const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/receipts
 * @desc    Get all unpaid receipts
 * @access  Protected
 */
router.patch('/:id/pay', protect, authorize('admin', 'manager','cashier'), receiptController.payReceipt);
router.get('/', protect, authorize('cashier', 'manager', 'admin'), receiptController.getReceipts);

module.exports = router;
