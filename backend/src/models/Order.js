const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    tableNumber: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    waiterName: {
        type: String,
        required: false
    },
    items: [{
        meal: {
            type: String,
            required: true
        },
        qty: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
