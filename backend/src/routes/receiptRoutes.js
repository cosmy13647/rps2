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
router.get('/waiter/:name', protect, receiptController.getReceiptsByWaiter);
module.exports = router;
const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/receipts
 * @desc    Get all unpaid receipts
 * @access  Protected
 */
router.patch('/:id/pay', protect, authorize('admin', 'manager', 'cashier'), receiptController.payReceipt);
router.get('/', protect, authorize('cashier', 'manager', 'admin'), receiptController.getReceipts);
router.get('/waiter/:name', protect, receiptController.getReceiptsByWaiter);

/**
 * @route   POST /api/receipts/:id/send-stk
 * @desc    Trigger an M-Pesa STK push for a receipt
 * @access  Protected
 */
router.post('/:id/send-stk', protect, authorize('admin', 'manager', 'cashier'), receiptController.sendStk);

/**
 * @route   POST /api/receipts/mpesa/callback
 * @desc    Safaricom's async result callback for the STK push
 * @access  Public — Safaricom calls this directly, no user session exists
 */
router.post('/mpesa/callback', receiptController.mpesaCallback);

module.exports = router;