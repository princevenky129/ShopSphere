const Coupon = require('../models/Coupon');

// @desc    Create a new coupon (admin only)
// @route   POST /api/coupons
const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, expiresAt } = req.body;

    // Check if a coupon with this code already exists
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      expiresAt: expiresAt || undefined, // avoid saving an empty string as a date
    });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all coupons (admin only)
// @route   GET /api/coupons
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Deactivate a coupon (admin only) — soft delete, not a real delete
// @route   PUT /api/coupons/:id/deactivate
const deactivateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    coupon.isActive = false;
    await coupon.save();
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Validate a coupon code (any logged-in customer, used at Checkout)
// @route   POST /api/coupons/validate
const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: 'This coupon is no longer active' });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ message: 'This coupon has expired' });
    }

    // Valid — send back what the frontend needs to show/calc the discount
    res.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCoupon, getCoupons, deactivateCoupon, validateCoupon };