const express = require('express');
const router = express.Router();
const { getAnalytics, getAllCustomers, getCustomerDetail } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// protect = must be logged in, admin = must have admin role
router.get('/analytics', protect, admin, getAnalytics);

// NEW - Week 10: Customer Management
router.get('/customers', protect, admin, getAllCustomers);
router.get('/customers/:id', protect, admin, getCustomerDetail);

module.exports = router;