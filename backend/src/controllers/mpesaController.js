const { stkPush } = require('../services/mpesa.service');
const { pool } = require('../config/db');

const initiateStkPush = async (req, res) => {
  const { amount, phone, reference, description } = req.body;

  if (!amount || !phone || !reference) {
    return res.status(400).json({
      success: false,
      message: 'amount, phone, and reference are required',
    });
  }

  const normalizedPhone = phone.startsWith('0')
    ? '254' + phone.slice(1)
    : phone;

  try {
    const result = await stkPush(
      amount,
      normalizedPhone,
      reference,
      description || 'Supermarket Payment'
    );

    if (result.ResponseCode === '0') {
      await pool.query(
        `INSERT INTO transactions (phone, amount, reference, status, checkout_request_id, merchant_request_id)
         VALUES ($1, $2, $3, 'pending', $4, $5)`,
        [normalizedPhone, amount, reference, result.CheckoutRequestID, result.MerchantRequestID]
      );

      return res.json({
        success: true,
        message: 'STK Push sent — ask customer to enter PIN',
        checkoutRequestId: result.CheckoutRequestID,
        merchantRequestId: result.MerchantRequestID,
      });
    }

    return res.status(400).json({
      success: false,
      message: result.ResponseDescription,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.response?.data || err.message,
    });
  }
};

const mpesaCallback = async (req, res) => {
  try {
    const callbackData = req.body.Body.stkCallback;
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;

    if (ResultCode === 0) {
      const items = CallbackMetadata.Item;
      const get = (name) => items.find((i) => i.Name === name)?.Value;

      const mpesaReceipt = get('MpesaReceiptNumber');
      const amount = get('Amount');
      const phone = get('PhoneNumber');

      await pool.query(
        `UPDATE transactions
         SET status = 'completed', mpesa_receipt = $1, updated_at = NOW()
         WHERE checkout_request_id = $2`,
        [mpesaReceipt, CheckoutRequestID]
      );

      console.log('Payment successful:', { mpesaReceipt, amount, phone });
    } else {
      await pool.query(
        `UPDATE transactions
         SET status = 'failed', updated_at = NOW()
         WHERE checkout_request_id = $1`,
        [CheckoutRequestID]
      );

      console.log('Payment failed:', ResultDesc);
    }

    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('Callback error:', err.message);
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

const getSaleStatus = async (req, res) => {
  const { checkoutRequestId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE checkout_request_id = $1',
      [checkoutRequestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const transaction = result.rows[0];
    return res.json({
      success: true,
      status: transaction.status,
      mpesaReceipt: transaction.mpesa_receipt,
      amount: transaction.amount,
      phone: transaction.phone,
      reference: transaction.reference,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
const getAllTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions ORDER BY created_at DESC LIMIT 50'
    );

    return res.json({
      success: true,
      count: result.rows.length,
      transactions: result.rows,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
module.exports = { initiateStkPush, mpesaCallback, getSaleStatus, getAllTransactions };