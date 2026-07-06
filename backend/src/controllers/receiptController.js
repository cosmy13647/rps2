const pool = require('../config/db');
const { getIO } = require('../config/socket');

exports.payReceipt = async (req, res) => {
    const { id } = req.params;
    const { payment_method, amount_paid } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Get receipt and its linked order
        const receiptResult = await client.query(
            `SELECT r.*, o.subtotal FROM receipts r
             JOIN orders o ON r.order_id = o.id
             WHERE r.id = $1`,
            [id]
        );

        const receipt = receiptResult.rows[0];

        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        if (receipt.status !== 'unpaid') {
            return res.status(400).json({ message: 'Receipt is already paid or voided' });
        }

        // 2. Calculate change
        const change_given = amount_paid - receipt.subtotal;

        // 3. Update receipt
        const updatedReceipt = await client.query(
            `UPDATE receipts 
             SET status = 'paid', payment_method = $1, amount_paid = $2, change_given = $3
             WHERE id = $4
             RETURNING *`,
            [payment_method, amount_paid, change_given, id]
        );

        // 4. Update order status to completed
        await client.query(
            `UPDATE orders SET status = 'completed', updated_at = NOW()
             WHERE id = $1`,
            [receipt.order_id]
        );

        await client.query('COMMIT');

        // 5. Emit socket event
        getIO().emit('receipt:paid', updatedReceipt.rows[0]);

        res.json({ message: 'Payment successful', receipt: updatedReceipt.rows[0] });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing payment:', error);
        res.status(500).json({ message: 'Failed to process payment', error: error.message });
    } finally {
        client.release();
    }
};  
exports.getReceipts = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.*, o.table_number, o.waiter_name, o.subtotal,
             json_agg(json_build_object(
                'meal_name', oi.meal_name,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'line_total', oi.line_total
             )) as items
             FROM receipts r
             JOIN orders o ON r.order_id = o.id
             JOIN order_items oi ON oi.order_id = o.id
             WHERE r.status = 'unpaid'
             GROUP BY r.id, o.table_number, o.waiter_name, o.subtotal
             ORDER BY r.created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching receipts:', error);
        res.status(500).json({ message: 'Failed to fetch receipts' });
    }
};