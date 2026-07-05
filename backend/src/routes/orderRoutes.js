const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const{protect , authorize} = require('../middleware/authMiddleware');

/**
 * @route   POST /api/orders
 * @desc    Create a new order and receipt
 * @access  Public
 */
router.post('/', protect, authorize('admin', 'manager','cashier'), orderController.createOrder);
module.exports = router;
