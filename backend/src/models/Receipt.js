const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    billId: {
        type: String,
        required: true,
        unique: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: false
    },
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
        enum: ['unpaid', 'paid', 'voided'],
        default: 'unpaid'
    },
    voidReason: {
        type: String,
        required: false
    },
    printedAt: {
        type: Date,
        required: false
    },
    paidAt: {
        type: Date,
        required: false
    },
    printCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Receipt = mongoose.model('Receipt', receiptSchema);

module.exports = Receipt;
