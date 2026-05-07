const VoidRequest = require('../models/VoidRequest');
const Receipt = require('../models/Receipt');
const { getIO } = require('../config/socket');

/**
 * @desc    Create a new void request for a receipt
 * @route   POST /api/void-requests
 * @access  Public
 */
exports.createVoidRequest = async (req, res) => {
    try {
        const {
            receiptId,
            reason,
            requestedBy
        } = req.body;

        // 1. Check if receipt is already paid
        const receipt = await Receipt.findById(receiptId);
        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        if (receipt.status === 'paid') {
            return res.status(400).json({ message: 'Cannot void a paid receipt' });
        }

        const newVoidRequest = new VoidRequest({
            receiptId,
            reason,
            requestedBy
        });

        const savedVoidRequest = await newVoidRequest.save();

        // Emit Socket.io event
        getIO().emit('voidRequest:created', savedVoidRequest);

        res.status(201).json(savedVoidRequest);
    } catch (error) {
        console.error('Error creating void request:', error);
        res.status(500).json({
            message: 'Failed to create void request',
            error: error.message
        });
    }
};

/**
 * @desc    Approve a void request and update the linked receipt
 * @route   PATCH /api/void-requests/:id/approve
 * @access  Public
 */
exports.approveVoidRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewedBy, role } = req.body;

        // Basic role check
        if (role !== 'manager') {
            return res.status(403).json({ message: 'Forbidden: Only managers can approve void requests' });
        }

        // 1. Update VoidRequest status
        const voidRequest = await VoidRequest.findByIdAndUpdate(
            id,
            {
                status: 'approved',
                reviewedBy,
                reviewedAt: new Date()
            },
            { new: true }
        );

        if (!voidRequest) {
            return res.status(404).json({ message: 'Void request not found' });
        }

        // 2. Update the linked Receipt
        const receipt = await Receipt.findByIdAndUpdate(
            voidRequest.receiptId,
            {
                status: 'voided',
                voidReason: voidRequest.reason
            },
            { new: true }
        );

        res.json({
            voidRequest,
            receipt
        });

        // Emit Socket.io event
        getIO().emit('voidRequest:updated', voidRequest);
    } catch (error) {
        console.error('Error approving void request:', error);
        res.status(500).json({
            message: 'Failed to approve void request',
            error: error.message
        });
    }
};

/**
 * @desc    Reject a void request
 * @route   PATCH /api/void-requests/:id/reject
 * @access  Public
 */
exports.rejectVoidRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewedBy, role } = req.body;

        // Basic role check
        if (role !== 'manager') {
            return res.status(403).json({ message: 'Forbidden: Only managers can reject void requests' });
        }

        const voidRequest = await VoidRequest.findByIdAndUpdate(
            id,
            {
                status: 'rejected',
                reviewedBy,
                reviewedAt: new Date()
            },
            { new: true }
        );

        if (!voidRequest) {
            return res.status(404).json({ message: 'Void request not found' });
        }

        res.json({ voidRequest });

        // Emit Socket.io event
        getIO().emit('voidRequest:updated', voidRequest);
    } catch (error) {
        console.error('Error rejecting void request:', error);
        res.status(500).json({
            message: 'Failed to reject void request',
            error: error.message
        });
    }
};
