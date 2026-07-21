const mongoose = require('mongoose');

// A review is a sub-document — it doesn't get its own collection,
// it lives directly inside the product that owns it.
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true, // snapshot of the reviewer's name at review time
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // gives each review its own createdAt
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    images: [
      {
        type: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // New fields for reviews:
    reviews: [reviewSchema],
    averageRating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);