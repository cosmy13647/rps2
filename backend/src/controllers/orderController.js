const pool = require('../config/db');
const { getIO } = require('../config/socket');

exports.createOrder = async (req, res) => {
    const { table_number, waiter_name, items, subtotal } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Order must have at least one item' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Insert order
        const orderResult = await client.query(
            `INSERT INTO orders (table_number, waiter_name, subtotal)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [table_number, waiter_name, subtotal]
        );
        const order = orderResult.rows[0];

        // 2. Insert order items
        for (const item of items) {
            await client.query(
                `INSERT INTO order_items (order_id, meal_name, quantity, unit_price, line_total)
                 VALUES ($1, $2, $3, $4, $5)`,
                [order.id, item.meal_name, item.quantity, item.unit_price, item.line_total]
            );
        }

        // 3. Generate receipt number
        const counterResult = await client.query(
            `UPDATE counters SET seq = seq + 1 WHERE name = 'receipt' RETURNING seq`
        );
        const seq = counterResult.rows[0].seq;
        const receipt_number = `RCP-${String(seq).padStart(3, '0')}`;

        // 4. Insert receipt
        const receiptResult = await client.query(
            `INSERT INTO receipts (receipt_number, order_id, status)
             VALUES ($1, $2, 'unpaid')
             RETURNING *`,
            [receipt_number, order.id]
        );
        const receipt = receiptResult.rows[0];
console.log('Receipt result:', receiptResult.rows);
        await client.query('COMMIT');

        // 5. Emit kitchen alert
        getIO().emit('order:created', {
            order,
            items,
            waiter_name,
            table_number
        });

        res.status(201).json({ order, receipt, items });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Failed to create order', error: error.message });
    } finally {
        client.release();
    }
};