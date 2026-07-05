const express = require('express');
const router = express.Router();
const voidRequestController = require('../controllers/voidRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('cashier', 'manager', 'admin'), voidRequestController.createVoidRequest);
router.patch('/:id/approve', protect, authorize('manager', 'admin'), voidRequestController.approveVoidRequest);
router.patch('/:id/reject', protect, authorize('manager', 'admin'), voidRequestController.rejectVoidRequest);

module.exports = router;