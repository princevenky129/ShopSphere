const Wishlist = require('../models/Wishlist');

// @desc    Get logged-in user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');

    if (!wishlist) {
      // Same pattern as your Cart controller: no wishlist yet?
      // Return an empty one instead of a 404, so the frontend
      // doesn't need special-case error handling for new users.
      return res.json({ user: req.user._id, products: [] });
    }

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add a product to the wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      // First time this user has wishlisted anything
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: [productId],
      });
    } else {
      // Only add if it's not already in there — avoid duplicates
      const alreadyExists = wishlist.products.some(
        (id) => id.toString() === productId
      );

      if (!alreadyExists) {
        wishlist.products.push(productId);
        await wishlist.save();
      }
    }

    wishlist = await wishlist.populate('products');
    res.status(201).json(wishlist);
  } catch (error) {
    res.status(400).json({ message: 'Could not add to wishlist', error: error.message });
  }
};

// @desc    Remove a product from the wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId
    );

    await wishlist.save();

    const updatedWishlist = await wishlist.populate('products');
    res.json(updatedWishlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };