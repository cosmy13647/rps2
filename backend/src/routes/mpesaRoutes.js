const express = require('express');
const router = express.Router();
const { initiateStkPush, mpesaCallback, getSaleStatus, getAllTransactions } = require('../controllers/mpesaController');
const { getAccessToken } = require('../services/mpesa.service');

router.get('/test-token', async (req, res) => {
  try {
    const token = await getAccessToken();
    res.json({ success: true, token });
  } catch (err) {
    console.error('Token error:', err);
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

router.post('/stk-push', initiateStkPush);
router.post('/callback', mpesaCallback);
router.get('/status/:checkoutRequestId', getSaleStatus);
router.get('/transactions', getAllTransactions);

module.exports = router;