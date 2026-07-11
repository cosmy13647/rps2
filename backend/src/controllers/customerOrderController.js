const pool = require('../config/db');
const { getIO } = require('../config/socket');

// POST /api/orders/customer — public, no login
exports.createCustomerOrder = async (req, res) => {
  const { table_number, items, guest_session_id, customer_name } = req.body;

  if (!table_number) return res.status(400).json({ message: 'Table number is required' });
  if (!guest_session_id) return res.status(400).json({ message: 'Missing guest session' });
  if (!items || items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO orders (table_number, waiter_name, subtotal, status, source, guest_session_id, customer_name)
       VALUES ($1, NULL, $2, 'pending', 'online', $3, $4)
       RETURNING *`,
      [table_number, subtotal, guest_session_id, customer_name || null]
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, meal_name, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.meal_name, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
    }

    const counterResult = await client.query(
      `UPDATE counters SET seq = seq + 1 WHERE name = 'receipt' RETURNING seq`
    );
    const seq = counterResult.rows[0].seq;
    const bill_id = `#B${String(seq).padStart(4, '0')}`;

    const receiptResult = await client.query(
      `INSERT INTO receipts (receipt_number, order_id, status)
       VALUES ($1, $2, 'unpaid')
       RETURNING *`,
      [bill_id, order.id]
    );

    await client.query('COMMIT');

    getIO().emit('order:created', {
      order,
      items,
      table_number,
      source: 'online',
      billId: bill_id
    });

    res.status(201).json({ order, receipt: receiptResult.rows[0], items, billId: bill_id });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating customer order:', error);
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  } finally {
    client.release();
  }
};

// GET /api/orders/customer?session_id=xxx
exports.getCustomerOrders = async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ message: 'session_id is required' });

  try {
    const result = await pool.query(
      `SELECT o.id, o.table_number, o.status, o.subtotal, o.created_at,
              r.receipt_number AS bill_id
       FROM orders o
       LEFT JOIN receipts r ON r.order_id = o.id
       WHERE o.guest_session_id = $1
       ORDER BY o.created_at DESC
       LIMIT 20`,
      [session_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// PATCH /api/orders/customer/:id/cancel
exports.cancelCustomerOrder = async (req, res) => {
  const { id } = req.params;
  const { session_id } = req.body;

  try {
    const check = await pool.query(`SELECT * FROM orders WHERE id = $1`, [id]);
    const order = check.rows[0];

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.guest_session_id !== session_id) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    }

    const result = await pool.query(
      `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    getIO().emit('order:updated', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
};
