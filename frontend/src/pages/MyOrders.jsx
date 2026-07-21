import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

// The fixed sequence of statuses an order moves through.
// This order matters — it's how we figure out which steps are "done"
// versus "still coming" for the visual tracker below.
const ORDER_STEPS = ["pending", "shipped", "delivered"];

// Small helper: pick a color for each status badge, same idea as
// AdminOrders.jsx already does on the admin side.
const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
};

// NEW: renders a horizontal step tracker like a mini progress bar.
// Takes the order's current status and shows all 3 steps, with steps
// up to and including the current one highlighted.
function OrderStatusTracker({ currentStatus }) {
  // Find where the current status sits in the sequence.
  // e.g. if currentStatus is "shipped", currentIndex will be 1.
  const currentIndex = ORDER_STEPS.indexOf(currentStatus);

  return (
    <div className="flex items-center mt-4 mb-2">
      {ORDER_STEPS.map((step, index) => {
        // A step is "completed" if it comes at or before the current status
        const isCompleted = index <= currentIndex;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              {/* The circle marker for this step */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isCompleted
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? "✓" : index + 1}
              </div>
              {/* The label under the circle */}
              <span
                className={`text-xs mt-1 capitalize ${
                  isCompleted ? "text-indigo-600 font-medium" : "text-gray-400"
                }`}
              >
                {step}
              </span>
            </div>

            {/* The connecting line between circles — skip after the last step */}
            {index < ORDER_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-4 ${
                  index < currentIndex ? "bg-indigo-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axiosInstance.get("/orders/my-orders");
        setOrders(response.data);
      } catch (err) {
        setError("Could not load your orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <p className="text-center py-10 text-gray-500">Loading orders...</p>;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
          <Link to="/" className="text-indigo-600 hover:underline text-sm">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Order #{order._id.slice(-8)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[order.status]}`}
                >
                  {order.status}
                </span>
              </div>

              {/* NEW: visual step tracker showing order progress */}
              <OrderStatusTracker currentStatus={order.status} />

              <div className="mt-3 space-y-1">
                {order.orderItems.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm text-gray-700">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-sm">
                  {order.isPaid ? (
                    <span className="text-green-600">Paid</span>
                  ) : (
                    <span className="text-red-500">Payment pending</span>
                  )}
                </span>
                <span className="font-semibold">₹{order.totalPrice}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}