const express = require('express');
const { verifyPickup, getPickupLogs } = require('../controllers/verification');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes below are protected
router.use(protect);

// Only staff and admin can verify pickups
router.post('/verify-pickup', authorize('staff', 'admin'), verifyPickup);

// Only staff and admin can view logs
router.get('/logs', authorize('staff', 'admin'), getPickupLogs);

module.exports = router;
