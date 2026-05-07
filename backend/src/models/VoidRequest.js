const mongoose = require('mongoose');

const voidRequestSchema = new mongoose.Schema({
    receiptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Receipt',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.Mixed, // Can be String or ObjectId
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    reviewedAt: {
        type: Date,
        required: false
    }
}, {
    timestamps: true
});

const VoidRequest = mongoose.model('VoidRequest', voidRequestSchema);

module.exports = VoidRequest;
