const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// Place a new order (any logged-in user)
router.post('/', protect, placeOrder);

// Get logged-in user's own order history
// NOTE: this must come BEFORE '/:id' or Express will think "my-orders" is an :id!
router.get('/my-orders', protect, getMyOrders);

// Admin: get all orders
router.get('/', protect, admin, getAllOrders);

// Get single order by ID (owner or admin)
router.get('/:id', protect, getOrderById);

// Admin: update order status
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;