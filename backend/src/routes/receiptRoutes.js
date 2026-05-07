const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');

/**
 * @route   POST /api/receipts
 * @desc    Create a new receipt
 * @access  Public
 */
router.post('/', receiptController.createReceipt);

/**
 * @route   PATCH /api/receipts/:id/pay
 * @desc    Update receipt status to paid
 * @access  Public
 */
router.patch('/:id/pay', receiptController.payReceipt);

/**
 * @route   PATCH /api/receipts/:id/printed
 * @desc    Update printedAt and increment printCount
 * @access  Public
 */
router.patch('/:id/printed', receiptController.updatePrinted);

/**
 * @route   GET /api/receipts/bill/:billId
 * @desc    Get a single receipt by billId
 * @access  Public
 */
router.get('/bill/:billId', receiptController.getReceiptByBillId);

module.exports = router;
