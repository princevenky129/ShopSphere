const Product = require('../models/Product');

// @desc    Get all products (with optional search/filter/pagination/sorting)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    // req.query holds anything after the ? in the URL
    // e.g. /api/products?category=shoes&search=nike&page=2&limit=8&sort=price_asc&minPrice=500&maxPrice=2000&minRating=4
    const { search, category, page, limit, sort, minPrice, maxPrice, minRating } = req.query;

    // Build a filter object dynamically
    const filter = {};

    if (search) {
      // $regex does a "contains" style text match
      // $options: 'i' makes it case-insensitive
      filter.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    // --- NEW: PRICE RANGE FILTER ---
    // MongoDB uses $gte (greater than or equal) and $lte (less than or equal)
    // to build "between" style range queries.
    // We only add minPrice/maxPrice to the filter if they were actually sent,
    // so this doesn't break requests that don't use price filtering at all.
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // --- NEW: MINIMUM RATING FILTER ---
    // "4 stars and up" style filter, same $gte idea.
    if (minRating) {
      filter.averageRating = { $gte: Number(minRating) };
    }

    // --- PAGINATION SETUP (unchanged) ---
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 8;
    const skip = (pageNumber - 1) * limitNumber;

    // --- SORTING SETUP (unchanged) ---
    let sortOption = {};
    if (sort === 'price_asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { price: -1 };
    } else if (sort === 'popularity') {
      sortOption = { averageRating: -1 };
    }

    // --- COUNT TOTAL MATCHING PRODUCTS (after all filters, before pagination) ---
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limitNumber);

    // --- FETCH THE ACTUAL PAGE OF PRODUCTS ---
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    res.json({
      products,
      currentPage: pageNumber,
      totalPages,
      totalProducts,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, images } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      images,
      createdBy: req.user._id,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Invalid product data', error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, description, price, category, stock, images } = req.body;

    product.name = name ?? product.name;
    product.description = description ?? product.description;
    product.price = price ?? product.price;
    product.category = category ?? product.category;
    product.stock = stock ?? product.stock;
    product.images = images ?? product.images;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Update failed', error: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new review for a product
// @route   POST /api/products/:id/reviews
// @access  Private (any logged-in user)
const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const alreadyReviewed = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);

    product.numReviews = product.reviews.length;
    product.averageRating =
      product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;

    await product.save();

    res.status(201).json({ message: 'Review added', reviews: product.reviews });
  } catch (error) {
    res.status(400).json({ message: 'Could not add review', error: error.message });
  }
};

// @desc    Get recommended products for a given product
// @route   GET /api/products/:id/recommendations
// @access  Public
const getRecommendations = async (req, res) => {
  try {
    const RECOMMENDATION_LIMIT = 4;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Step 1: try to find products in the SAME category,
    // excluding the product being viewed itself ($ne = "not equal").
    // Sorted by averageRating descending so the best-rated show first.
    const sameCategoryProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    })
      .sort({ averageRating: -1 })
      .limit(RECOMMENDATION_LIMIT);

    // Step 2: if same-category didn't give us enough (e.g. a category
    // with only 1-2 products), backfill the remaining slots with the
    // highest-rated products from ANY category.
    let recommendations = sameCategoryProducts;

    if (recommendations.length < RECOMMENDATION_LIMIT) {
      const remainingSlots = RECOMMENDATION_LIMIT - recommendations.length;

      // Build a list of IDs to exclude: the viewed product itself,
      // plus whatever we already picked in step 1 (avoid duplicates).
      const excludeIds = [product._id, ...recommendations.map((p) => p._id)];

      const backfillProducts = await Product.find({
        _id: { $nin: excludeIds }, // $nin = "not in this list"
      })
        .sort({ averageRating: -1 })
        .limit(remainingSlots);

      recommendations = [...recommendations, ...backfillProducts];
    }

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createReview,
  getRecommendations,
};