const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', menuController.getMenu);
router.post('/', protect, authorize('admin', 'manager', 'waiter', 'accountant'), menuController.createMenuItem);

module.exports = router;
