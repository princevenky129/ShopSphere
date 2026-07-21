const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const sendEmail = require('../utils/sendEmail');

// @desc    Place a new order from the user's cart
// @route   POST /api/orders
// @access  Private (logged-in users only)
const placeOrder = async (req, res) => {
  try {
    // NEW - Week 10: shippingAddress must be sent from the frontend —
    // Checkout.jsx will send either the user's saved default address,
    // a different saved address they picked, or a freshly-typed one.
    // We check it here, BEFORE touching cart/stock/coupon logic, so we
    // fail fast with a clear message instead of partially processing
    // an order that has nowhere to ship to.
    const { shippingAddress } = req.body;

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.addressLine1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postalCode ||
      !shippingAddress.country
    ) {
      return res.status(400).json({ message: 'A complete shipping address is required' });
    }

    // NEW - Week 10: validate paymentMethod the same strict way — never
    // trust an unexpected value, only allow the three we support.
    const { paymentMethod } = req.body;
    const validPaymentMethods = ['card', 'upi_netbanking', 'cod'];
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: 'A valid payment method is required' });
    }

    // Step 1: Find the logged-in user's cart
    // req.user.id comes from your JWT "protect" middleware
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

    // Step 2: If there's no cart, or it's empty, stop here
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // Step 3: Loop through cart items, check stock, and build orderItems
    const orderItems = [];
    let totalPrice = 0;

    for (const item of cart.items) {
      const product = item.product; // this is the full Product doc (thanks to .populate)

      // Safety check: product might have been deleted after being added to cart
      if (!product) {
        return res.status(400).json({ message: 'One of the products no longer exists' });
      }

      // Check if enough stock is available
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for "${product.name}". Only ${product.stock} left.`,
        });
      }

      // Snapshot the product details into the order item
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images[0] || '', // use first image if it exists
        price: product.price,
        quantity: item.quantity,
      });

      // Add to running total
      totalPrice += product.price * item.quantity;
    }

    // Step 3.5: If a coupon code was sent, validate it server-side and apply the discount
    // We NEVER trust a discount amount calculated on the frontend — only the code itself.
    let couponCode = null;
    let discountAmount = 0;

    if (req.body.couponCode) {
      const coupon = await Coupon.findOne({ code: req.body.couponCode.toUpperCase() });

      if (!coupon) {
        return res.status(400).json({ message: 'Invalid coupon code' });
      }
      if (!coupon.isActive) {
        return res.status(400).json({ message: 'This coupon is no longer active' });
      }
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return res.status(400).json({ message: 'This coupon has expired' });
      }

      // Calculate the discount fresh, from the real coupon + the real totalPrice
      // we just computed above — not from anything the frontend sent us.
      if (coupon.discountType === 'percentage') {
        discountAmount = (totalPrice * coupon.discountValue) / 100;
      } else {
        // 'flat' discount
        discountAmount = coupon.discountValue;
      }

      // Safety: never let a discount push the total below zero
      // (e.g. a ₹500 flat coupon on a ₹300 order)
      if (discountAmount > totalPrice) {
        discountAmount = totalPrice;
      }

      couponCode = coupon.code;
      totalPrice = totalPrice - discountAmount;
    }

    // Step 4: Reduce stock for each product
    // We do this AFTER checking all items pass the stock check,
    // so we don't partially reduce stock if a later item fails
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity }, // $inc decreases the number
      });
    }

    // Step 5: Create the order
    // NEW - Week 10: shippingAddress is saved as-is into the order — it's
    // a plain object matching the shape defined in the Order model, so
    // Mongoose validates each inner field (fullName, phone, etc.) automatically.
    const order = await Order.create({
      user: req.user.id,
      orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      couponCode,
      discountAmount,
    });

    // Step 6: Clear the user's cart
    cart.items = [];
    await cart.save();

    // Step 6.5: Send an order confirmation email
    // req.user comes from your "protect" middleware, which looks up the
    // full user in the database — so req.user.email and req.user.name
    // should already be available here, no extra DB call needed.
    //
    // Build a simple HTML list of what was ordered, for the email body.
    const itemsListHtml = orderItems
      .map(
        (item) =>
          `<li>${item.name} × ${item.quantity} — ₹${item.price * item.quantity}</li>`
      )
      .join('');

    const emailHtml = `
      <h2>Thanks for your order, ${req.user.name}!</h2>
      <p>Your order <strong>#${order._id}</strong> has been placed successfully.</p>
      <ul>${itemsListHtml}</ul>
      ${
        couponCode
          ? `<p>Coupon applied: <strong>${couponCode}</strong> (−₹${discountAmount.toFixed(2)})</p>`
          : ''
      }
      <p><strong>Total: ₹${totalPrice.toFixed(2)}</strong></p>
      <p>Shipping to: ${shippingAddress.fullName}, ${shippingAddress.addressLine1}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}</p>
      <p>We'll notify you once your order ships.</p>
    `;

    // We deliberately don't "await" this in a way that blocks the response
    // for long, and sendEmail() already catches its own errors internally
    // (see utils/sendEmail.js) — so even if this fails, it won't crash
    // the order or stop the response below from being sent.
    sendEmail({
      to: req.user.email,
      subject: `ShopSphere Order Confirmation — #${order._id}`,
      html: emailHtml,
    });

    // Step 7: Send back the created order
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error placing order', error: error.message });
  }
};

// @desc    Get logged-in user's own orders (order history)
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching orders', error: error.message });
  }
};

// @desc    Get a single order by ID (order detail page)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching order', error: error.message });
  }
};

// @desc    Get ALL orders (admin dashboard) — paginated
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    // req.query holds anything after the ? in the URL, e.g. /api/orders?page=2&limit=10
    const { page, limit } = req.query;

    // Convert query params (which arrive as strings) to numbers, with defaults.
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10; // 10 orders per admin page

    // How many documents to skip to reach the requested page
    const skip = (pageNumber - 1) * limitNumber;

    // Count ALL orders (no filter here, since this route has no search/filter
    // yet — just every order in the system) so we know how many pages exist.
    const totalOrders = await Order.countDocuments({});
    const totalPages = Math.ceil(totalOrders / limitNumber);

    // Fetch just this page of orders, newest first (unchanged sort behavior)
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    // Same response shape as the products endpoint, so the frontend pattern
    // stays consistent: an array plus pagination info.
    res.status(200).json({
      orders,
      currentPage: pageNumber,
      totalPages,
      totalOrders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching orders', error: error.message });
  }
};

// @desc    Update order status (admin marks it shipped/delivered)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'shipped', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;

    // NEW - Week 10: for Cash on Delivery orders, "delivered" is the exact
    // moment cash actually changes hands — so we treat it as payment
    // confirmation too, same as Stripe's confirmPayment marking isPaid.
    // Card/UPI orders are unaffected — they're already marked paid at
    // checkout time, well before delivery.
    if (status === 'delivered' && order.paymentMethod === 'cod' && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
    }

    await order.save();

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating order status', error: error.message });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};