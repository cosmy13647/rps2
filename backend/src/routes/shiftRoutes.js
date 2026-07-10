const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');

router.post('/open', shiftController.openShift);
router.get('/current', shiftController.getCurrentShift);
router.post('/:id/petty-cash', shiftController.addPettyCash);
router.get('/:id/summary', shiftController.getShiftSummary);
router.post('/:id/close', shiftController.closeShift);

module.exports = router;

// TODO: mount this in server.js, same pattern as your other routes:
//
// const shiftRoutes = require('./src/routes/shiftRoutes');
// app.use('/api/shifts', shiftRoutes);
//
// These routes assume your existing auth middleware runs first and
// sets req.user (used for req.user.id throughout the controller) —
// apply it the same way your other protected routes do.