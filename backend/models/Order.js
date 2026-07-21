const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      name: { type: String, required: true },
      image: { type: String }, // just one image for the order summary
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  // NEW - Week 10: a SNAPSHOT of the shipping address at the moment the
  // order was placed. This is NOT a reference (no "ref: 'User'" pointing
  // back to one of the user's saved addresses) — it's a full copy, for
  // the same reason orderItems copies product name/price instead of just
  // linking to the Product: if the user later edits or deletes that saved
  // address, this order should still show exactly where it was shipped.
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  // NEW - Week 10: tracks which payment method was used for this order.
  // 'card' = Stripe, 'upi_netbanking' = Razorpay (coming next), 'cod' = Cash on Delivery.
  paymentMethod: {
    type: String,
    enum: ['card', 'upi_netbanking', 'cod'],
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  couponCode: {
    type: String,
    default: null,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'shipped', 'delivered'],
    default: 'pending',
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', orderSchema);