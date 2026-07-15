const pool = require('../config/db');
const { getIO } = require('../config/socket');
const { getIO, notifyOrderReady } = require('../config/socket');
exports.createOrder = async (req, res) => {
    const { table_number, waiter_name, items, subtotal, order_type } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Order must have at least one item' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Insert order
        const orderResult = await client.query(
    `INSERT INTO orders (table_number, waiter_name, subtotal, order_type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [table_number, waiter_name, subtotal, order_type || 'table']
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

// GET /api/orders/pending
// Returns all orders the kitchen hasn't finished, with their items attached.
exports.getPendingOrders = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                o.id,
                o.table_number,
                o.waiter_name,
                o.subtotal,
                o.status,
                o.created_at,
                COALESCE(
                    json_agg(
                        json_build_object('meal_name', oi.meal_name, 'quantity', oi.quantity)
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'
                ) AS items
             FROM orders o
             LEFT JOIN order_items oi ON oi.order_id = o.id
             WHERE o.status = 'pending'
             GROUP BY o.id
             ORDER BY o.created_at ASC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        res.status(500).json({ message: 'Failed to fetch pending orders', error: error.message });
    }
};

// PATCH /api/orders/:id/status
// Body: { status: 'pending' | 'completed' | 'cancelled' }
// NOTE: these are the values enforced by the existing orders_status_check
// constraint already in the database — confirmed via:
//   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
//   WHERE conname = 'orders_status_check';
exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        const result = await pool.query(
            `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        );
const order = result.rows[0];

getIO().emit('order:updated', order);

if (order.status === 'ready') {
    notifyOrderReady(order);
}

res.json(order);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = result.rows[0];

        // Let any other open kitchen screens stay in sync in real time
        getIO().emit('order:updated', order);

        res.json(order);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Failed to update order status', error: error.message });
    }
};
// GET /api/menu
exports.getMenu = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM menu_items WHERE is_available = true ORDER BY category, name`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch menu' });
    }
};

// POST /api/orders/customer
exports.createCustomerOrder = async (req, res) => {
    const { table_number, items, subtotal, guest_session_id } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: 'No items' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const orderResult = await client.query(
            `INSERT INTO orders (table_number, waiter_name, subtotal, guest_session_id)
             VALUES ($1, 'Customer', $2, $3) RETURNING *`,
            [table_number, subtotal, guest_session_id]
        );
        const order = orderResult.rows[0];

        for (const item of items) {
            await client.query(
                `INSERT INTO order_items (order_id, meal_name, quantity, unit_price, line_total)
                 VALUES ($1, $2, $3, $4, $5)`,
                [order.id, item.meal_name, item.quantity, item.unit_price, item.line_total]
            );
        }

        const counterResult = await client.query(
            `UPDATE counters SET seq = seq + 1 WHERE name = 'receipt' RETURNING seq`
        );
        const seq = counterResult.rows[0].seq;
        const receipt_number = `RCP-${String(seq).padStart(3, '0')}`;

        await client.query(
            `INSERT INTO receipts (receipt_number, order_id, status) VALUES ($1, $2, 'unpaid')`,
            [receipt_number, order.id]
        );

        await client.query('COMMIT');

        getIO().emit('order:created', { order, items, table_number });

        res.status(201).json(order);
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Failed to create order', error: error.message });
    } finally {
        client.release();
    }
};

// GET /api/orders/customer
exports.getCustomerOrders = async (req, res) => {
    try {
        const sessionId = req.query.sessionId || req.query.session_id;
        const result = await pool.query(
            `SELECT o.* FROM orders o WHERE o.guest_session_id = $1 ORDER BY o.created_at DESC`,
            [sessionId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
};

// PATCH /api/orders/customer/:id/cancel
exports.cancelCustomerOrder = async (req, res) => {
    try {
        const { id } = req.params;
      const sessionId = req.body.sessionId || req.body.session_id;

        const result = await pool.query(
            `UPDATE orders SET status = 'cancelled' 
             WHERE id = $1 AND guest_session_id = $2 AND status = 'pending'
             RETURNING *`,
            [id, sessionId]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Order cannot be cancelled' });
        }

        getIO().emit('order:updated', result.rows[0]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Failed to cancel order' });
    }
};