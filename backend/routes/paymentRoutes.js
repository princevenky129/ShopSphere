const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/confirm-payment', protect, confirmPayment);

// NEW - Week 10
router.post('/create-razorpay-order', protect, createRazorpayOrder);
router.post('/verify-razorpay-payment', protect, verifyRazorpayPayment);

module.exports = router;