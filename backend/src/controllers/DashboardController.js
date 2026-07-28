const pool = require('../config/db');

/**
 * @desc    Lightweight aggregate counts for the Admin Dashboard KPI cards.
 *          Deliberately does NOT recompute revenue — that's already
 *          correctly owned by GET /api/revenue/today, this just adds
 *          the counts nothing else currently exposes.
 * @route   GET /api/dashboard/summary
 * @access  Protected — admin, manager
 *
 * NOTE on "active_tables": there's no dedicated tables/occupancy table
 * in the schema — this is derived as "distinct table_number values
 * with an order that isn't completed/cancelled yet", which is the
 * closest available proxy. Worth revisiting if a real table-management
 * feature gets built later.
 */
exports.getSummary = async (req, res) => {
    try {
        const [ordersToday, activeTables, kitchenQueue, unpaidReceipts] = await Promise.all([
            pool.query(
                `SELECT COUNT(*) AS count FROM orders
                 WHERE created_at >= CURRENT_DATE
                   AND created_at < CURRENT_DATE + INTERVAL '1 day'`
            ),
            pool.query(
                `SELECT COUNT(DISTINCT table_number) AS count FROM orders
                 WHERE table_number IS NOT NULL
                   AND status NOT IN ('completed', 'cancelled')`
            ),
            pool.query(
                `SELECT COUNT(*) AS count FROM orders
                 WHERE status IN ('pending', 'preparing')`
            ),
            pool.query(
                `SELECT COUNT(*) AS count FROM receipts WHERE status = 'unpaid'`
            ),
        ]);

        res.json({
            orders_today: parseInt(ordersToday.rows[0].count, 10),
            active_tables: parseInt(activeTables.rows[0].count, 10),
            kitchen_queue: parseInt(kitchenQueue.rows[0].count, 10),
            unpaid_receipts: parseInt(unpaidReceipts.rows[0].count, 10),
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({
            message: 'Failed to fetch dashboard summary',
            error: error.message,
        });
    }
};
