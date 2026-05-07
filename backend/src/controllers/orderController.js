 const Order = require('../models/Order');
const Receipt = require('../models/Receipt');
const generateBillId = require('../utils/generateBillId');
const { getIO } = require('../config/socket');

/**
 * @desc    Create a new order and automatically generate a receipt
 * @route   POST /api/orders
 * @access  Public
 */
exports.createOrder = async (req, res) => {
    try {
        const {
            tableNumber,
            waiterName,
            items,
            subtotal
        } = req.body;

        // Validation: Empty items
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Order must have at least one item' });
        }

        // 1. Create and save the Order
        const newOrder = new Order({
            tableNumber,
            waiterName,
            items,
            subtotal
        });

        const savedOrder = await newOrder.save();

        // 2. Generate a unique billId for the Receipt
        const billId = await generateBillId();

        // 3. Create and save the Receipt linked to the Order
        const newReceipt = new Receipt({
            billId,
            orderId: savedOrder._id,
            tableNumber,
            waiterName,
            items,
            subtotal,
            status: 'unpaid',
            printedAt: new Date()
        });

        const savedReceipt = await newReceipt.save();

        // Emit Socket.io event
        getIO().emit('receipt:created', savedReceipt);

        // 4. Return both
        res.status(201).json({
            order: savedOrder,
            receipt: savedReceipt
        });
    } catch (error) {
        console.error('Error creating order and receipt:', error);
        res.status(500).json({
            message: 'Failed to create order and receipt',
            error: error.message
        });
    }
};
