const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/ShiftController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/open', protect, authorize('cashier', 'manager', 'admin'), shiftController.openShift);
router.get('/current', protect, shiftController.getCurrentShift);
router.post('/:id/petty-cash', protect, authorize('cashier', 'manager', 'admin'), shiftController.addPettyCash);
router.get('/:id/summary', protect, authorize('cashier', 'manager', 'admin'), shiftController.getShiftSummary);
router.post('/:id/close', protect, authorize('cashier', 'manager', 'admin'), shiftController.closeShift);

module.exports = router; 