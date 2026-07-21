import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // NEW: pagination state, same pattern as AdminProducts.jsx —
  // plain component state since this is an internal admin page,
  // not something that needs a shareable URL.
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10; // orders per page in the admin table

  useEffect(() => {
    fetchOrders();
    // Re-fetch whenever the page number changes
  }, [page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/orders", {
        params: { page, limit: LIMIT },
      });

      // FIX: res.data is now an object { orders, currentPage, totalPages,
      // totalOrders } — not a plain array — because the backend was
      // updated to support pagination. We need res.data.orders for the
      // actual array, and totalPages for the Next/Previous buttons.
      setOrders(res.data.orders);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await axiosInstance.put("/orders/" + orderId + "/status", {
        status: newStatus,
      });

      // Update just this one order in local state instead of refetching everything
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: res.data.status } : order
        )
      );
    } catch (err) {
      setError("Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const statusColor = (status) => {
    if (status === "pending") return "bg-yellow-100 text-yellow-700";
    if (status === "shipped") return "bg-blue-100 text-blue-700";
    if (status === "delivered") return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Orders</h1>

      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <>
          <table className="w-full bg-white shadow rounded">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Placed On</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b align-top">
                  <td className="p-3 text-xs text-gray-500">{order._id}</td>

                  <td className="p-3">
                    <div className="font-medium">{order.user?.name || "Unknown"}</div>
                    <div className="text-xs text-gray-500">{order.user?.email}</div>
                  </td>

                  <td className="p-3">
                    {order.orderItems.map((item) => (
                      <div key={item.product} className="text-sm">
                        {item.name} x {item.quantity}
                      </div>
                    ))}
                  </td>

                  <td className="p-3">₹{order.totalPrice}</td>

                  <td className="p-3">
                    <span className={"px-2 py-1 rounded text-xs font-medium " + statusColor(order.status)}>
                      {order.status}
                    </span>

                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      disabled={updatingId === order._id}
                      className="block mt-2 border rounded text-sm p-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </td>

                  <td className="p-3 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* NEW: pagination controls — only show if there's more than 1 page */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="text-sm px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-400"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="text-sm px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-400"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminOrders;