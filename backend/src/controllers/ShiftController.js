const pool = require('../config/db');
const { getIO } = require('../config/socket');

// POST /api/shifts/open
// body: { opening_float }
exports.openShift = async (req, res) => {
    const { opening_float } = req.body;
    const opened_by = req.user.id;

    if (opening_float === undefined || opening_float === null || isNaN(opening_float)) {
        return res.status(400).json({ message: 'opening_float is required and must be a number' });
    }

    try {
        const existing = await pool.query(`SELECT id FROM shifts WHERE status = 'open'`);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'A shift is already open', shift: existing.rows[0] });
        }

        const result = await pool.query(
            `INSERT INTO shifts (opened_by, opening_float)
             VALUES ($1, $2)
             RETURNING *`,
            [opened_by, opening_float]
        );

        const shift = result.rows[0];
        getIO().emit('shift:opened', shift);
        res.status(201).json(shift);
    } catch (error) {
        console.error('Error opening shift:', error);
        res.status(500).json({ message: 'Failed to open shift', error: error.message });
    }
};

// GET /api/shifts/current
// Returns the current open shift, or null. Not scoped to any one
// cashier — shared till model.
exports.getCurrentShift = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, u.full_name AS opened_by_name
             FROM shifts s
             JOIN users u ON u.id = s.opened_by
             WHERE s.status = 'open'
             LIMIT 1`
        );
        res.json(result.rows[0] || null);
    } catch (error) {
        console.error('Error fetching current shift:', error);
        res.status(500).json({ message: 'Failed to fetch current shift', error: error.message });
    }
};

// POST /api/shifts/:id/petty-cash
// body: { amount, reason }
exports.addPettyCash = async (req, res) => {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const logged_by = req.user.id;

    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'amount must be a positive number' });
    }
    if (!reason || !reason.trim()) {
        return res.status(400).json({ message: 'reason is required' });
    }

    try {
        const shiftCheck = await pool.query(`SELECT status FROM shifts WHERE id = $1`, [id]);
        if (shiftCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Shift not found' });
        }
        if (shiftCheck.rows[0].status !== 'open') {
            return res.status(400).json({ message: 'Cannot log petty cash against a closed shift' });
        }

        const result = await pool.query(
            `INSERT INTO petty_cash_entries (shift_id, amount, reason, logged_by)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [id, amount, reason.trim(), logged_by]
        );

        const entry = result.rows[0];
        getIO().emit('shift:pettyCashAdded', entry);
        res.status(201).json(entry);
    } catch (error) {
        console.error('Error adding petty cash entry:', error);
        res.status(500).json({ message: 'Failed to add petty cash entry', error: error.message });
    }
};

// Shared calculation used by both the preview (GET summary) and the
// real close (POST close), so the two can never disagree.
async function computeShiftSummary(shiftId) {
    const shiftResult = await pool.query(`SELECT * FROM shifts WHERE id = $1`, [shiftId]);
    const shift = shiftResult.rows[0];
    if (!shift) return null;

    const salesResult = await pool.query(
        `SELECT payment_method, COALESCE(SUM(amount_paid), 0) AS total
         FROM receipts
         WHERE shift_id = $1 AND status = 'paid'
         GROUP BY payment_method`,
        [shiftId]
    );

    const totals = { cash: 0, mpesa_till: 0, mpesa_paybill: 0, mpesa_pochi: 0 };
    salesResult.rows.forEach((row) => {
        if (totals.hasOwnProperty(row.payment_method)) {
            totals[row.payment_method] = parseFloat(row.total);
        }
    });

    const voidedResult = await pool.query(
        `SELECT COALESCE(SUM(subtotal), 0) AS total
         FROM receipts
         WHERE shift_id = $1 AND status = 'voided'`,
        [shiftId]
    );
    const voided_total = parseFloat(voidedResult.rows[0].total);

    const pettyResult = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM petty_cash_entries
         WHERE shift_id = $1`,
        [shiftId]
    );
    const petty_cash_out = parseFloat(pettyResult.rows[0].total);

    const pendingVoidsResult = await pool.query(
        `SELECT COUNT(*) AS count
         FROM void_requests vr
         JOIN receipts r ON r.id = vr.receipt_id
         WHERE vr.status = 'pending' AND r.shift_id = $1`,
        [shiftId]
    );
    const pending_void_requests = parseInt(pendingVoidsResult.rows[0].count, 10);

    const opening_float = parseFloat(shift.opening_float);
    const expected_cash = opening_float + totals.cash - petty_cash_out;
    const grand_total = totals.cash + totals.mpesa_till + totals.mpesa_paybill + totals.mpesa_pochi;

    const closing_cash_count = shift.closing_cash_count !== null
        ? parseFloat(shift.closing_cash_count)
        : null;
    const variance = closing_cash_count !== null ? closing_cash_count - expected_cash : null;

    return {
        shift_id: shift.id,
        status: shift.status,
        opened_by: shift.opened_by,
        opened_at: shift.opened_at,
        opening_float,
        cash_sales: totals.cash,
        mpesa_till: totals.mpesa_till,
        mpesa_paybill: totals.mpesa_paybill,
        mpesa_pochi: totals.mpesa_pochi,
        voided_total,
        petty_cash_out,
        expected_cash,
        grand_total,
        tips_declared: parseFloat(shift.tips_declared) || 0,
        closing_cash_count,
        variance,
        pending_void_requests,
    };
}

// GET /api/shifts/:id/summary
exports.getShiftSummary = async (req, res) => {
    const { id } = req.params;
    try {
        const summary = await computeShiftSummary(id);
        if (!summary) return res.status(404).json({ message: 'Shift not found' });
        res.json(summary);
    } catch (error) {
        console.error('Error computing shift summary:', error);
        res.status(500).json({ message: 'Failed to compute shift summary', error: error.message });
    }
};

// POST /api/shifts/:id/close
// body: { closing_cash_count, tips_declared, notes? }
exports.closeShift = async (req, res) => {
    const { id } = req.params;
    const { closing_cash_count, tips_declared, notes } = req.body;
    const closed_by = req.user.id;

    if (closing_cash_count === undefined || closing_cash_count === null || isNaN(closing_cash_count)) {
        return res.status(400).json({ message: 'closing_cash_count is required and must be a number' });
    }

    try {
        const shiftCheck = await pool.query(`SELECT status FROM shifts WHERE id = $1`, [id]);
        if (shiftCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Shift not found' });
        }
        if (shiftCheck.rows[0].status !== 'open') {
            return res.status(400).json({ message: 'Shift is already closed' });
        }

        // Stamp the counted values first, then recompute the summary
        // server-side using those exact stored numbers — never trust a
        // client-submitted variance.
        await pool.query(
            `UPDATE shifts
             SET closing_cash_count = $1,
                 tips_declared = $2,
                 notes = $3,
                 closed_by = $4,
                 closed_at = NOW(),
                 status = 'closed'
             WHERE id = $5`,
            [closing_cash_count, tips_declared || 0, notes || null, closed_by, id]
        );

        const summary = await computeShiftSummary(id);
        getIO().emit('shift:closed', summary);
        res.json(summary);
    } catch (error) {
        console.error('Error closing shift:', error);
        res.status(500).json({ message: 'Failed to close shift', error: error.message });
    }
};
