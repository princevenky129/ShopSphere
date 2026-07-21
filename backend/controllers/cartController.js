const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get logged-in user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    // .populate() replaces the product ID with the full product document
    // so the frontend gets name, price, images etc. directly, not just an ID
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product'
    );

    if (!cart) {
      // No cart yet? Return an empty one instead of a 404 —
      // this keeps the frontend logic simple (no error handling needed
      // just because someone hasn't added anything yet)
      return res.json({ user: req.user._id, items: [] });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add an item to the cart (or increase quantity if it exists)
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Make sure the product actually exists before adding it
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      // First time this user adds anything — create a new cart
      cart = await Cart.create({
        user: req.user._id,
        items: [{ product: productId, quantity }],
      });
    } else {
      // Cart exists — check if this product is already in it
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        // Already in cart — just bump the quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // New product for this cart — push a new item
        cart.items.push({ product: productId, quantity });
      }

      await cart.save();
    }

    // Populate before sending back so frontend has full product details
    cart = await cart.populate('items.product');
    res.status(201).json(cart);
  } catch (error) {
    res.status(400).json({ message: 'Could not add to cart', error: error.message });
  }
};

// @desc    Update quantity of an item already in the cart
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not in cart' });
    }

    item.quantity = quantity;
    await cart.save();

    const updatedCart = await cart.populate('items.product');
    res.json(updatedCart);
  } catch (error) {
    res.status(400).json({ message: 'Update failed', error: error.message });
  }
};

// @desc    Remove an item from the cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // .filter() keeps everything EXCEPT the item we want to remove
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();

    const updatedCart = await cart.populate('items.product');
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
};