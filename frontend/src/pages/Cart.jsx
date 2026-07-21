import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCart = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get("/cart");
      setCart(response.data);
    } catch (err) {
      setError("Could not load cart. Are you logged in?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Matches: PUT /api/cart/:productId, body { quantity }
  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return; // backend rejects quantity < 1 anyway
    try {
      await axiosInstance.put(`/cart/${productId}`, { quantity: newQuantity });
      fetchCart(); // re-fetch so totals and UI stay in sync with the backend
    } catch (err) {
      setError("Failed to update quantity.");
    }
  };

  // Matches: DELETE /api/cart/:productId
  const handleRemove = async (productId) => {
    try {
      await axiosInstance.delete(`/cart/${productId}`);
      fetchCart();
    } catch (err) {
      setError("Failed to remove item.");
    }
  };

  if (loading) return <p className="text-center py-10 text-gray-500">Loading cart...</p>;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;

  const items = cart?.items || [];

  // Calculate the total on the frontend for display purposes only.
  // Your backend should independently recalculate this at order-placement
  // time — never trust a frontend-computed total for real payments.
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">Your Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <Link to="/" className="text-indigo-600 hover:underline text-sm">
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.product._id}
                className="flex items-center justify-between border-b border-gray-200 pb-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.product.name}</p>
                  <p className="text-sm text-gray-500">₹{item.product.price} each</p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleUpdateQuantity(item.product._id, Number(e.target.value))
                    }
                    className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm"
                  />
                  <span className="font-medium w-20 text-right">
                    ₹{item.product.price * item.quantity}
                  </span>
                  <button
                    onClick={() => handleRemove(item.product._id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <span className="text-lg font-semibold">Total: ₹{total}</span>
            <Link
              to="/checkout"
              className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}