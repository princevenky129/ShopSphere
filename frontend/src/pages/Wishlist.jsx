import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import ProductCard from "../components/ProductCard";

export default function Wishlist() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await axiosInstance.get("/wishlist");
        setProducts(response.data.products);
      } catch (err) {
        setError("Could not load wishlist. Are you logged in?");
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  if (loading) return <p className="text-center py-10 text-gray-500">Loading...</p>;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">My Wishlist</h1>

      {products.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">Your wishlist is empty.</p>
          <Link to="/" className="text-indigo-600 hover:underline text-sm">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}