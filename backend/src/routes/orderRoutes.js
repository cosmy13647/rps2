const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const customerOrderController = require('../controllers/customerOrderController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/orders
 * @desc    Create a new order and receipt (staff/manual entry)
 * @access  Protected — cashier, manager, admin, waiter
 */
router.post('/', protect, authorize('cashier', 'manager', 'admin', 'waiter'), orderController.createOrder);

router.get('/pending', protect, orderController.getPendingOrders);
router.patch('/:id/status', protect, authorize('kitchen', 'manager', 'admin'), orderController.updateOrderStatus);

/**
 * Customer-facing routes — guest session, no login required
 */
router.post('/customer', customerOrderController.createCustomerOrder);
router.get('/customer', customerOrderController.getCustomerOrders);
router.patch('/customer/:id/cancel', customerOrderController.cancelCustomerOrder);

module.exports = router;
