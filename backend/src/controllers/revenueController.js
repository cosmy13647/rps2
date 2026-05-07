const Receipt = require('../models/Receipt');

/**
 * @desc    Get total revenue and count of paid receipts for today
 * @route   GET /api/revenue/today
 * @access  Public
 */
exports.getTodayRevenue = async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const result = await Receipt.aggregate([
            {
                $match: {
                    status: 'paid',
                    createdAt: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$subtotal' },
                    paidReceiptsCount: { $sum: 1 }
                }
            }
        ]);

        const data = result.length > 0 ? result[0] : { totalRevenue: 0, paidReceiptsCount: 0 };

        res.json({
            totalRevenue: data.totalRevenue,
            paidReceiptsCount: data.paidReceiptsCount
        });
    } catch (error) {
        console.error('Error fetching today\'s revenue:', error);
        res.status(500).json({
            message: 'Failed to fetch revenue data',
            error: error.message
        });
    }
};
