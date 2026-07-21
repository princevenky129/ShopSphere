const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

// Same access pattern as cart — any logged-in user manages their own wishlist
router.get('/', protect, getWishlist);
router.post('/', protect, addToWishlist);
router.delete('/:productId', protect, removeFromWishlist);

module.exports = router;