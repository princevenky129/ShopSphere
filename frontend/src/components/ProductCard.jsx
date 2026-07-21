import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [checking, setChecking] = useState(false);

  // On mount, check if this product is already in the user's wishlist,
  // so the heart shows filled/unfilled correctly right from the start.
  useEffect(() => {
    if (!user) return; // don't bother checking if not logged in

    const checkWishlist = async () => {
      try {
        const response = await axiosInstance.get("/wishlist");
        const found = response.data.products.some(
          (p) => p._id === product._id
        );
        setIsWishlisted(found);
      } catch (err) {
        // fail silently — wishlist status just won't show, not critical
      }
    };
    checkWishlist();
  }, [user, product._id]);

  const handleToggleWishlist = async (e) => {
    e.preventDefault(); // stop the parent <Link> from navigating
    e.stopPropagation(); // stop the click from bubbling up to the card

    if (!user) {
      alert("Please log in to use your wishlist.");
      return;
    }

    setChecking(true);
    try {
      if (isWishlisted) {
        await axiosInstance.delete(`/wishlist/${product._id}`);
        setIsWishlisted(false);
      } else {
        await axiosInstance.post("/wishlist", { productId: product._id });
        setIsWishlisted(true);
      }
    } catch (err) {
      // silently ignore — could add a toast/error message later
    } finally {
      setChecking(false);
    }
  };

  return (
    <Link
      to={`/products/${product._id}`}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden relative"
    >
      <button
        onClick={handleToggleWishlist}
        disabled={checking}
        className="absolute top-2 right-2 z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow disabled:opacity-50"
      >
        <span className={isWishlisted ? "text-red-500" : "text-gray-400"}>
          {isWishlisted ? "♥" : "♡"}
        </span>
      </button>

      <div className="h-48 bg-gray-100 flex items-center justify-center">
        {product.images && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-gray-400 text-sm">No image</span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{product.category}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-semibold text-indigo-600">
            ₹{product.price}
          </span>
          {product.stock === 0 && (
            <span className="text-xs text-red-500 font-medium">Out of stock</span>
          )}
        </div>
      </div>
    </Link>
  );
}