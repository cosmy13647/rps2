const express = require('express');
const router = express.Router();
const generateBillId = require('../utils/generateBillId');

/**
 * @route   GET /api/test/bill
 * @desc    Generate and return a new bill ID
 * @access  Public (for testing)
 */
router.get('/bill', async (req, res) => {
    try {
        const billId = await generateBillId();
        res.json({ billId });
    } catch (error) {
        console.error('Error generating bill ID:', error);
        res.status(500).json({ error: 'Failed to generate bill ID' });
    }
});

module.exports = router;
