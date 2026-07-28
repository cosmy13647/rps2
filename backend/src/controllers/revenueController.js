const pool = require('../config/db');

/**
 * @desc    Get total revenue and count of paid receipts for today
 * @route   GET /api/revenue/today
 * @access  Protected — admin, manager
 */
exports.getTodayRevenue = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                COALESCE(SUM(amount_paid), 0) AS total_revenue,
                COUNT(*) AS paid_receipts_today
             FROM receipts
             WHERE status = 'paid'
               AND created_at >= CURRENT_DATE
               AND created_at < CURRENT_DATE + INTERVAL '1 day'`
        );

        const row = result.rows[0];
        res.json({
            total_revenue: parseFloat(row.total_revenue),
            paid_receipts_today: parseInt(row.paid_receipts_today, 10),
        });
    } catch (error) {
        console.error("Error fetching today's revenue:", error);
        res.status(500).json({
            message: 'Failed to fetch revenue data',
            error: error.message,
        });
    }
};