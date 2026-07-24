const pool = require('../config/db');
const { getIO } = require('../config/socket');
const { stkPush } = require('../services/mpesa.service');
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
exports.getReceiptsByWaiter = async (req, res) => {
    try {
        const { name } = req.params;
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
             WHERE o.waiter_name = $1 AND r.status = 'unpaid'
             GROUP BY r.id, o.table_number, o.waiter_name, o.subtotal
             ORDER BY r.created_at DESC`,
            [name]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch receipts' });
    }
};
exports.sendStk = async (req, res) => {
    const { id } = req.params;
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: 'Customer phone number is required' });
    }

    try {
        const receiptResult = await pool.query(
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

        const amount = Math.round(Number(receipt.subtotal));

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Receipt total must be greater than zero' });
        }

        const stkResponse = await stkPush(
            amount,
            phone,
            receipt.id,
            `Payment for receipt ${receipt.id}`
        );

        if (!stkResponse.CheckoutRequestID) {
            console.error('STK push did not return a CheckoutRequestID:', stkResponse);
            return res.status(502).json({
                message: 'M-Pesa did not return a CheckoutRequestID',
                mpesa_response: stkResponse,
            });
        }

        const updated = await pool.query(
            `UPDATE receipts
             SET checkout_request_id = $1,
                 merchant_request_id = $2,
                 mpesa_status = 'pending'
             WHERE id = $3
             RETURNING *`,
            [stkResponse.CheckoutRequestID, stkResponse.MerchantRequestID, id]
        );

        res.json({
            message: 'STK push sent',
            receipt: updated.rows[0],
            checkout_request_id: stkResponse.CheckoutRequestID,
        });

    } catch (error) {
        console.error('Error sending STK push:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Failed to send STK push',
            error: error.response?.data || error.message,
        });
    }
};

exports.mpesaCallback = async (req, res) => {
    const callback = req.body?.Body?.stkCallback;

    if (!callback) {
        console.error('Malformed M-Pesa callback payload:', req.body);
        return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc } = callback;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const receiptResult = await client.query(
            `SELECT r.*, o.subtotal FROM receipts r
             JOIN orders o ON r.order_id = o.id
             WHERE r.checkout_request_id = $1`,
            [CheckoutRequestID]
        );

        const receipt = receiptResult.rows[0];

        if (!receipt) {
            console.error('No receipt found for CheckoutRequestID:', CheckoutRequestID);
            await client.query('ROLLBACK');
            return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
        }

        if (receipt.status === 'paid') {
            await client.query('ROLLBACK');
            return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
        }

        if (ResultCode !== 0) {
            await client.query(
                `UPDATE receipts SET mpesa_status = 'failed' WHERE id = $1`,
                [receipt.id]
            );
            await client.query('COMMIT');
            console.log(`STK push failed for receipt ${receipt.id}: ${ResultDesc}`);
            return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
        }

        const items = callback.CallbackMetadata?.Item || [];
        const getVal = (name) => items.find((i) => i.Name === name)?.Value;

        const amountPaid = getVal('Amount');
        const mpesaReceiptNumber = getVal('MpesaReceiptNumber');
        const change_given = amountPaid - receipt.subtotal;

        const updatedReceipt = await client.query(
            `UPDATE receipts
             SET status = 'paid',
                 payment_method = 'mpesa',
                 amount_paid = $1,
                 change_given = $2,
                 mpesa_status = 'completed',
                 payment_reference = $3
             WHERE id = $4
             RETURNING *`,
            [amountPaid, change_given, mpesaReceiptNumber, receipt.id]
        );

        await client.query(
            `UPDATE orders SET status = 'completed', updated_at = NOW()
             WHERE id = $1`,
            [receipt.order_id]
        );

        await client.query('COMMIT');

        getIO().emit('receipt:paid', updatedReceipt.rows[0]);

        res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing M-Pesa callback:', error);
        res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } finally {
        client.release();
    }
};