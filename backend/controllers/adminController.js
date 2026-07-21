const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User'); // NEW - Week 10

// @desc    Get dashboard analytics (revenue, orders, top products, stock, trend)
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    // --- 1. TOTAL REVENUE ---
    // We use MongoDB's aggregation pipeline here. Think of it as a series
    // of steps the data passes through, each one transforming it further.
    // $match = "filter" (only paid orders count as real revenue)
    // $group = "combine into one summary" — _id: null means "one group total"
    // $sum = add up the totalPrice field across all matched orders
    const revenueResult = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
    ]);
    // aggregate() always returns an array. If there are zero paid orders,
    // that array is empty — so we default to 0 to avoid a crash.
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // --- 2. TOTAL ORDERS ---
    // Simple count, paid or not.
    const totalOrders = await Order.countDocuments();

    // --- 3. ORDERS BY STATUS ---
    // Group orders by their status field and count how many are in each.
    const statusResult = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    // statusResult looks like: [{ _id: 'pending', count: 3 }, { _id: 'shipped', count: 1 }]
    // We convert that into a clean, predictable object so the frontend
    // doesn't have to search through an array — and so statuses with
    // ZERO orders still show up as 0 instead of being missing entirely.
    const ordersByStatus = { pending: 0, shipped: 0, delivered: 0 };
    statusResult.forEach((item) => {
      ordersByStatus[item._id] = item.count;
    });

    // --- 4. TOP-SELLING PRODUCTS ---
    // Each order has an orderItems ARRAY (a customer can buy multiple products
    // in one order). $unwind "flattens" that array — it turns one order with
    // 3 items into 3 separate documents, one per item, so we can group by product.
    const topProductsResult = await Order.aggregate([
        { $unwind: '$orderItems' },
        {
          $group: {
            // CHANGED: group by product NAME instead of product ID.
            // Some test orders have mismatched product IDs for the same
            // product name (leftover from manual testing), which was
            // causing "Wireless Mouse" to show up as two separate rows.
            // Grouping by name merges those correctly into one row.
            _id: '$orderItems.name',
            name: { $first: '$orderItems.name' },
            totalSold: { $sum: '$orderItems.quantity' },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
      ]);

    // --- 5. LOW STOCK ALERTS ---
    const LOW_STOCK_THRESHOLD = 10; // easy to change later
    const lowStockProducts = await Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD } })
      .select('name stock') // only fetch the fields we actually need
      .sort({ stock: 1 }); // most urgent (lowest stock) first

    // --- 6. REVENUE OVER TIME (last 7 days) ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // today + 6 days back = 7 days
    sevenDaysAgo.setHours(0, 0, 0, 0); // start of that day

    const revenueOverTimeResult = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          // $dateToString groups orders by calendar day (e.g. "2026-07-19"),
          // ignoring the time portion — so 3 orders on the same day become 1 group.
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } }, // oldest date first, so the chart reads left-to-right
    ]);

    res.json({
      totalRevenue,
      totalOrders,
      ordersByStatus,
      topProducts: topProductsResult,
      lowStockProducts,
      revenueOverTime: revenueOverTimeResult,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all customers, paginated, with order count + total spent per customer
// @route   GET /api/admin/customers
// @access  Private/Admin
const getAllCustomers = async (req, res) => {
  try {
    // Same pagination pattern as getAllOrders/getProducts
    const { page, limit } = req.query;
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Only fetch USERS with role "customer" — admins don't belong in this table
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalPages = Math.ceil(totalCustomers / limitNumber);

    const customers = await User.find({ role: 'customer' })
      .select('name email createdAt updatedAt') // no password, no addresses needed here
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    // Now we need "totalOrders" and "totalSpent" PER customer. Rather than
    // running a separate query for each customer in a loop (slow — one
    // query per row), we run ONE aggregation across all orders belonging
    // to just the customers on this page, grouped by user.
    const customerIds = customers.map((c) => c._id);

    const orderStats = await Order.aggregate([
      { $match: { user: { $in: customerIds } } },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          // $cond is a MongoDB "if/else": if isPaid is true, add totalPrice
          // to the sum; otherwise add 0. Same "only paid orders count as
          // real spending" rule as totalRevenue above.
          totalSpent: {
            $sum: { $cond: [{ $eq: ['$isPaid', true] }, '$totalPrice', 0] },
          },
        },
      },
    ]);

    // Turn the aggregation result array into a lookup object, keyed by
    // user ID as a string, so we can quickly find each customer's stats
    // in the next step without looping through the array repeatedly.
    const statsByUserId = {};
    orderStats.forEach((stat) => {
      statsByUserId[stat._id.toString()] = stat;
    });

    // Merge each customer with their stats. If a customer has never
    // placed an order, they won't appear in orderStats at all — so we
    // default to 0/0 for them instead of crashing on "undefined".
    const customersWithStats = customers.map((customer) => {
      const stats = statsByUserId[customer._id.toString()];
      return {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        totalOrders: stats ? stats.totalOrders : 0,
        totalSpent: stats ? stats.totalSpent : 0,
      };
    });

    res.json({
      customers: customersWithStats,
      currentPage: pageNumber,
      totalPages,
      totalCustomers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get one customer's full profile + their complete order history
// @route   GET /api/admin/customers/:id
// @access  Private/Admin
const getCustomerDetail = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id).select(
      'name email createdAt updatedAt profilePicture addresses role'
    );

    // Make sure the ID actually belongs to a customer, not an admin —
    // this page isn't meant to expose other admins' details
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const totalSpent = orders
      .filter((order) => order.isPaid)
      .reduce((sum, order) => sum + order.totalPrice, 0);

    res.json({
      customer,
      orders,
      totalOrders,
      totalSpent,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getAnalytics, getAllCustomers, getCustomerDetail };