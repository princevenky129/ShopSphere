const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createReview,
  getRecommendations,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes — anyone can view products
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/:id/reviews', protect, createReview);
router.get('/:id/recommendations', getRecommendations);

// Admin-only routes — protect checks login, admin checks role
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;