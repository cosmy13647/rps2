const pool = require('../config/db');
const { getIO } = require('../config/socket');

exports.createVoidRequest = async (req, res) => {
    try {
        const { receipt_id, reason } = req.body;
        const requested_by = req.user.id;

        const receiptResult = await pool.query(
            `SELECT * FROM receipts WHERE id = $1`,
            [receipt_id]
        );

        const receipt = receiptResult.rows[0];

        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        if (receipt.status === 'voided') {
            return res.status(400).json({ message: 'Receipt is already voided' });
        }

        const result = await pool.query(
            `INSERT INTO void_requests (receipt_id, requested_by, reason)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [receipt_id, requested_by, reason]
        );

        const voidRequest = result.rows[0];
        getIO().emit('voidRequest:created', voidRequest);

        res.status(201).json({ message: 'Void request submitted', voidRequest });

    } catch (error) {
        console.error('Error creating void request:', error);
        res.status(500).json({ message: 'Failed to create void request', error: error.message });
    }
};

exports.approveVoidRequest = async (req, res) => {
    const { id } = req.params;
    const approved_by = req.user.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const voidResult = await client.query(
            `UPDATE void_requests 
             SET status = 'approved', approved_by = $1, approved_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [approved_by, id]
        );

        const voidRequest = voidResult.rows[0];

        if (!voidRequest) {
            return res.status(404).json({ message: 'Void request not found' });
        }

        await client.query(
            `UPDATE receipts SET status = 'voided'
             WHERE id = $1`,
            [voidRequest.receipt_id]
        );

        await client.query('COMMIT');

        getIO().emit('voidRequest:approved', voidRequest);
        res.json({ message: 'Void request approved', voidRequest });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error approving void request:', error);
        res.status(500).json({ message: 'Failed to approve void request', error: error.message });
    } finally {
        client.release();
    }
};

exports.rejectVoidRequest = async (req, res) => {
    const { id } = req.params;
    const approved_by = req.user.id;

    try {
        const result = await pool.query(
            `UPDATE void_requests
             SET status = 'rejected', approved_by = $1, approved_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [approved_by, id]
        );

        const voidRequest = result.rows[0];

        if (!voidRequest) {
            return res.status(404).json({ message: 'Void request not found' });
        }

        getIO().emit('voidRequest:rejected', voidRequest);
        res.json({ message: 'Void request rejected', voidRequest });

    } catch (error) {
        console.error('Error rejecting void request:', error);
        res.status(500).json({ message: 'Failed to reject void request', error: error.message });
    }
};