const express = require('express');
const router = express.Router();
const {
  createCoupon,
  getCoupons,
  deactivateCoupon,
  validateCoupon,
} = require('../controllers/couponController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, createCoupon);
router.get('/', protect, admin, getCoupons);
router.put('/:id/deactivate', protect, admin, deactivateCoupon);
router.post('/validate', protect, validateCoupon);

module.exports = router;