const Receipt = require('../models/Receipt');
const generateBillId = require('../utils/generateBillId');
const { getIO } = require('../config/socket');

/**
 * @desc    Create a new receipt
 * @route   POST /api/receipts
 * @access  Public
 */
exports.createReceipt = async (req, res) => {
    try {
        const {
            orderId,
            tableNumber,
            waiterName,
            items,
            subtotal,
            status,
            voidReason,
            printedAt
        } = req.body;

        // Validation: Empty items
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Receipt must have at least one item' });
        }

        // Generate a unique billId
        const billId = await generateBillId();

        // Create new receipt
        const newReceipt = new Receipt({
            billId,
            orderId,
            tableNumber,
            waiterName,
            items,
            subtotal,
            status,
            voidReason,
            printedAt: printedAt || new Date()
        });

        const savedReceipt = await newReceipt.save();

        // Emit Socket.io event
        getIO().emit('receipt:created', savedReceipt);

        res.status(201).json(savedReceipt);
    } catch (error) {
        console.error('Error creating receipt:', error);
        res.status(500).json({
            message: 'Failed to create receipt',
            error: error.message
        });
    }
};

/**
 * @desc    Update receipt status to paid
 * @route   PATCH /api/receipts/:id/pay
 * @access  Public
 */
exports.payReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Basic role check
        if (!['cashier', 'manager'].includes(role)) {
            return res.status(403).json({ message: 'Forbidden: Only cashiers or managers can process payments' });
        }

        // 1. Check if receipt is already voided
        const receipt = await Receipt.findById(id);
        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        if (receipt.status === 'voided') {
            return res.status(400).json({ message: 'Cannot pay a voided receipt' });
        }

        const updatedReceipt = await Receipt.findByIdAndUpdate(
            id,
            {
                status: 'paid',
                paidAt: new Date()
            },
            { new: true }
        );

        if (!updatedReceipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        // Emit Socket.io event
        getIO().emit('receipt:paid', updatedReceipt);

        res.json(updatedReceipt);
    } catch (error) {
        console.error('Error updating receipt to paid:', error);
        res.status(500).json({
            message: 'Failed to update receipt',
            error: error.message
        });
    }
};

/**
 * @desc    Update printedAt and increment printCount
 * @route   PATCH /api/receipts/:id/printed
 * @access  Public
 */
exports.updatePrinted = async (req, res) => {
    try {
        const { id } = req.params;

        const updatedReceipt = await Receipt.findByIdAndUpdate(
            id,
            {
                $set: { printedAt: new Date() },
                $inc: { printCount: 1 }
            },
            { new: true }
        );

        if (!updatedReceipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        res.json(updatedReceipt);
    } catch (error) {
        console.error('Error updating receipt print status:', error);
        res.status(500).json({
            message: 'Failed to update print status',
            error: error.message
        });
    }
};

/**
 * @desc    Get a single receipt by billId
 * @route   GET /api/receipts/bill/:billId
 * @access  Public
 */
exports.getReceiptByBillId = async (req, res) => {
    try {
        const { billId } = req.params;

        const receipt = await Receipt.findOne({ billId });

        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        res.json(receipt);
    } catch (error) {
        console.error('Error fetching receipt by billId:', error);
        res.status(500).json({
            message: 'Failed to fetch receipt',
            error: error.message
        });
    }
};
