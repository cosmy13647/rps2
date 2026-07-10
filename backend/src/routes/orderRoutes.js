const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const{protect , authorize} = require('../middleware/authMiddleware');

/**
 * @route   POST /api/orders
 * @desc    Create a new order and receipt
 * @access  Public
 */
router.post('/', protect, authorize('cashier', 'manager', 'admin', 'waiter'), orderController.createOrder);


router.get('/pending', protect, orderController.getPendingOrders);
router.patch('/:id/status', protect, authorize('kitchen', 'manager', 'admin'), orderController.updateOrderStatus);
 

module.exports = router;
