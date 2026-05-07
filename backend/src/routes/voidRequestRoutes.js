const express = require('express');
const router = express.Router();
const voidRequestController = require('../controllers/voidRequestController');

/**
 * @route   POST /api/void-requests
 * @desc    Create a new void request
 * @access  Public
 */
router.post('/', voidRequestController.createVoidRequest);

/**
 * @route   PATCH /api/void-requests/:id/approve
 * @desc    Approve a void request
 */
router.patch('/:id/approve', voidRequestController.approveVoidRequest);

/**
 * @route   PATCH /api/void-requests/:id/reject
 * @desc    Reject a void request
 */
router.patch('/:id/reject', voidRequestController.rejectVoidRequest);

module.exports = router;
