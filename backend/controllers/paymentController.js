// Initialize Stripe with our secret key from .env
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// NEW - Week 10: Razorpay SDK, initialized the same way as Stripe —
// with keys read from .env, never hardcoded in the file.
const Razorpay = require('razorpay');
const crypto = require('crypto'); // Node's built-in module for the signature check below
const Order = require('../models/Order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create a Stripe payment intent for a given order
// @route   POST /api/payment/create-payment-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Step 1: Find the order in our database
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Step 2: Security check — make sure this order belongs to the logged-in user
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to pay for this order' });
    }

    // Step 3: Don't allow paying twice for the same order
    if (order.isPaid) {
      return res.status(400).json({ message: 'This order has already been paid' });
    }

    // Step 4: Create the Payment Intent with Stripe
    // Stripe expects the amount in the SMALLEST currency unit
    // For INR, that's paise (₹1 = 100 paise), same idea as cents for USD
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.totalPrice * 100),
        currency: 'inr',
        payment_method_types: ['card'], // only allow card payments, no redirect-based methods
        metadata: {
          orderId: order._id.toString(),
        },
      });

    // Step 5: Send the client_secret back to the frontend
    // The frontend needs this to complete the payment using Stripe Elements
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating payment intent', error: error.message });
  }
};

// @desc    Confirm payment succeeded and mark order as paid
// @route   POST /api/payment/confirm-payment
// @access  Private
const confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    // Step 1: Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Step 2: Security check — order must belong to this user
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Step 3: IMPORTANT — don't trust the frontend's word that payment succeeded.
    // Ask Stripe directly what the real status of this payment is.
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        message: `Payment not completed. Current status: ${paymentIntent.status}`,
      });
    }

    // Step 4: Extra safety — make sure this payment intent actually belongs to this order
    // (using the metadata we attached when creating the payment intent)
    if (paymentIntent.metadata.orderId !== order._id.toString()) {
      return res.status(400).json({ message: 'Payment does not match this order' });
    }

    // Step 5: Everything checks out — mark the order as paid
    order.isPaid = true;
    order.paidAt = Date.now();
    await order.save();

    res.status(200).json({ message: 'Payment confirmed', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error confirming payment', error: error.message });
  }
};

// @desc    Create a Razorpay order for a given order (UPI/Netbanking/Wallet/Card)
// @route   POST /api/payment/create-razorpay-order
// @access  Private
// NEW - Week 10: Razorpay's equivalent of Stripe's "PaymentIntent" is
// called an "Order" — confusing since we ALSO call our own thing an
// "Order"! To keep these two concepts straight in your head: OUR Order
// (the Order model) represents "what the customer is buying." RAZORPAY's
// order represents "this specific payment attempt," and exists only
// inside Razorpay's system, tied to ours via the `receipt` field below.
const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to pay for this order' });
    }

    if (order.isPaid) {
      return res.status(400).json({ message: 'This order has already been paid' });
    }

    // Razorpay also expects amount in the smallest currency unit (paise),
    // exactly like Stripe.
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalPrice * 100),
      currency: 'INR',
      // "receipt" is just a label Razorpay stores alongside the order —
      // we use it to store OUR order's ID, so later we can trace a
      // Razorpay payment back to which of our orders it belongs to.
      receipt: order._id.toString(),
    });

    // Frontend needs three things to open the Razorpay popup:
    // - razorpayOrderId: ties the popup to this specific payment attempt
    // - amount: shown in the popup UI
    // - key: Razorpay's PUBLIC key (safe to expose to frontend — this is
    //   the Key ID, NOT the Key Secret, same public/private split as Stripe)
    res.status(200).json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating Razorpay order', error: error.message });
  }
};

// @desc    Verify a Razorpay payment and mark order as paid
// @route   POST /api/payment/verify-razorpay-payment
// @access  Private
// NEW - Week 10: Razorpay doesn't have a "retrieve payment status" call
// we ask for directly like Stripe's retrieve(). Instead, it gives the
// FRONTEND three values after a successful payment (order id, payment id,
// and a SIGNATURE), and it's OUR job to verify that signature ourselves,
// using our secret key, to prove the values weren't tampered with or faked.
// This is the Razorpay equivalent of "never trust the frontend alone."
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // This is the core security check. Razorpay's documented formula:
    // take "razorpay_order_id|razorpay_payment_id", run it through
    // HMAC-SHA256 using OUR secret key, and the result MUST exactly
    // match the signature Razorpay sent us. If someone tried to fake a
    // "payment succeeded" message without actually paying, they couldn't
    // reproduce this signature without knowing our secret key.
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed — signature mismatch' });
    }

    // Signature matches — payment is genuine. Mark the order as paid.
    order.isPaid = true;
    order.paidAt = Date.now();
    await order.save();

    res.status(200).json({ message: 'Payment verified', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error verifying payment', error: error.message });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
};