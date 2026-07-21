const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true, // stores "SAVE10" even if admin types "save10"
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date, // optional — no expiry if left blank
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);