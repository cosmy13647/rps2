const Counter = require('../models/Counter');

/**
 * Generates a unique, sequential bill ID formatted as #B0001, #B0002, etc.
 * @returns {Promise<string>} The formatted bill ID.
 */
const generateBillId = async () => {
    const counter = await Counter.findOneAndUpdate(
        { name: 'bill' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    // Format the sequence number to be 4 digits, padded with zeros (e.g., 1 -> 0001)
    const formattedSeq = counter.seq.toString().padStart(4, '0');

    return `#B${formattedSeq}`;
};

module.exports = generateBillId;
