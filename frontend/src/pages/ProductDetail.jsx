import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";

// Small reusable helper to render stars for a given rating (e.g. 4.5 -> ★★★★☆)
function StarRating({ rating }) {
  const fullStars = Math.round(rating);
  return (
    <span className="text-yellow-500">
      {"★".repeat(fullStars)}
      <span className="text-gray-300">{"★".repeat(5 - fullStars)}</span>
    </span>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [addingToCart, setAddingToCart] = useState(false);
  const [addedMessage, setAddedMessage] = useState("");

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistChecking, setWishlistChecking] = useState(false);

  // NEW: recommended products state
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const fetchProduct = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get(`/products/${id}`);
      setProduct(response.data);
    } catch (err) {
      setError("Product not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // NEW: fetch "You may also like" recommendations whenever the
  // viewed product (id) changes. This is a separate effect from
  // fetchProduct because it hits a different endpoint and shouldn't
  // block the main product details from showing while it loads.
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoadingRecommendations(true);
      try {
        const response = await axiosInstance.get(`/products/${id}/recommendations`);
        setRecommendations(response.data);
      } catch (err) {
        // fail silently — recommendations are a nice-to-have,
        // not worth showing an error banner over
        setRecommendations([]);
      } finally {
        setLoadingRecommendations(false);
      }
    };
    fetchRecommendations();
  }, [id]);

  useEffect(() => {
    if (!user) return;

    const checkWishlist = async () => {
      try {
        const response = await axiosInstance.get("/wishlist");
        const found = response.data.products.some((p) => p._id === id);
        setIsWishlisted(found);
      } catch (err) {
        // fail silently
      }
    };
    checkWishlist();
  }, [user, id]);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    setAddedMessage("");
    try {
      await axiosInstance.post("/cart", {
        productId: id,
        quantity: quantity,
      });
      setAddedMessage("Added to cart!");
    } catch (err) {
      setAddedMessage("Failed to add to cart. Are you logged in?");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      alert("Please log in to use your wishlist.");
      return;
    }

    setWishlistChecking(true);
    try {
      if (isWishlisted) {
        await axiosInstance.delete(`/wishlist/${id}`);
        setIsWishlisted(false);
      } else {
        await axiosInstance.post("/wishlist", { productId: id });
        setIsWishlisted(true);
      }
    } catch (err) {
      // silently ignore
    } finally {
      setWishlistChecking(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewError("");
    try {
      await axiosInstance.post(`/products/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      // Re-fetch the product so the new review, averageRating, and
      // numReviews all show up immediately without a manual refresh.
      await fetchProduct();
      setReviewComment("");
      setReviewRating(5);
    } catch (err) {
      setReviewError(err.response?.data?.message || "Could not submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <p className="text-center py-10 text-gray-500">Loading...</p>;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;
  if (!product) return null;

  // Check if the logged-in user has already reviewed this product,
  // so we can hide the form and avoid a guaranteed 400 error.
  const userHasReviewed =
    user && product.reviews.some((r) => r.user === user._id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/" className="text-sm text-indigo-600 hover:underline">
        ← Back to products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
      <div className="h-64 sm:h-80 bg-gray-100 rounded-lg flex items-center justify-center relative">
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-gray-400">No image</span>
          )}

          <button
            onClick={handleToggleWishlist}
            disabled={wishlistChecking}
            className="absolute top-3 right-3 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow disabled:opacity-50"
          >
            <span className={`text-xl ${isWishlisted ? "text-red-500" : "text-gray-400"}`}>
              {isWishlisted ? "♥" : "♡"}
            </span>
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{product.category}</p>

          {/* Rating summary */}
          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={product.averageRating} />
            <span className="text-sm text-gray-500">
              {product.averageRating.toFixed(1)} ({product.numReviews}{" "}
              {product.numReviews === 1 ? "review" : "reviews"})
            </span>
          </div>

          <p className="text-2xl font-bold text-indigo-600 mt-4">₹{product.price}</p>

          <p className="text-gray-700 mt-4 leading-relaxed">{product.description}</p>

          <p className="text-sm mt-4">
            {product.stock > 0 ? (
              <span className="text-green-600">{product.stock} in stock</span>
            ) : (
              <span className="text-red-500">Out of stock</span>
            )}
          </p>

          {product.stock > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-16 border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                />
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {addingToCart ? "Adding..." : "Add to Cart"}
                </button>
              </div>
              {addedMessage && (
                <p className="text-sm text-gray-600 mt-2">{addedMessage}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reviews section */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <h2 className="text-xl font-semibold mb-4">
          Reviews ({product.numReviews})
        </h2>

        {product.reviews.length === 0 ? (
          <p className="text-gray-500 text-sm mb-6">
            No reviews yet. Be the first to review this product.
          </p>
        ) : (
          <div className="space-y-4 mb-8">
            {product.reviews.map((review) => (
              <div key={review._id} className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{review.name}</span>
                  <StarRating rating={review.rating} />
                </div>
                <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Review form — only show if logged in and hasn't already reviewed */}
        {!user && (
          <p className="text-sm text-gray-500">
            <Link to="/login" className="text-indigo-600 hover:underline">
              Log in
            </Link>{" "}
            to write a review.
          </p>
        )}

        {user && userHasReviewed && (
          <p className="text-sm text-gray-500">You've already reviewed this product.</p>
        )}

        {user && !userHasReviewed && (
          <form onSubmit={handleSubmitReview} className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Rating
            </label>
            <select
              value={reviewRating}
              onChange={(e) => setReviewRating(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3 text-sm"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "star" : "stars"}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Review
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              required
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3 text-sm"
              placeholder="Share your thoughts about this product..."
            />

            {reviewError && (
              <p className="text-red-500 text-sm mb-3">{reviewError}</p>
            )}

            <button
              type="submit"
              disabled={submittingReview}
              className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}
        </div>
  
        {/* NEW: You may also like — recommended products */}
        {!loadingRecommendations && recommendations.length > 0 && (
          <div className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold mb-4">You may also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {recommendations.map((rec) => (
                <ProductCard key={rec._id} product={rec} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }