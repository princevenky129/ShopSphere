import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
};

function AdminCustomerDetail() {
  // useParams reads the ":id" part of the URL — e.g. for
  // /admin/customers/6a5b2c596c2f3b50e4c44026, params.id is that ID string
  const { id } = useParams();

  const [data, setData] = useState(null); // holds { customer, orders, totalOrders, totalSpent }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/customers/${id}`);
      setData(res.data);
    } catch (err) {
      setError("Failed to load customer details.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (loading) return <p className="p-6 text-gray-500">Loading customer...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!data) return null;

  const { customer, orders, totalOrders, totalSpent } = data;

  return (
    <div className="p-6 max-w-4xl">
      <Link to="/admin/customers" className="text-sm text-indigo-600 hover:underline">
        ← Back to Customers
      </Link>

      {/* Customer summary card */}
      <div className="bg-white shadow rounded p-6 mt-4 flex items-center gap-4">
        {customer.profilePicture ? (
          <img
            src={customer.profilePicture}
            alt={customer.name}
            className="w-16 h-16 rounded-full object-cover border"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-semibold">
            {customer.name?.[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold">{customer.name}</h1>
          <p className="text-sm text-gray-600">{customer.email}</p>
          <p className="text-xs text-gray-400 mt-1">
            Joined {formatDate(customer.createdAt)}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-white shadow rounded p-4">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <p className="text-sm text-gray-500">Total Spent</p>
          <p className="text-2xl font-bold">₹{totalSpent.toFixed(2)}</p>
        </div>
      </div>

      {/* Saved addresses */}
      {customer.addresses && customer.addresses.length > 0 && (
        <div className="bg-white shadow rounded p-6 mt-4">
          <h2 className="text-lg font-semibold mb-3">Saved Addresses</h2>
          <div className="space-y-2">
            {customer.addresses.map((address) => (
              <div key={address._id} className="border rounded p-3 text-sm border-gray-200">
                <p className="font-medium">
                  {address.fullName}{" "}
                  {address.isDefault && (
                    <span className="ml-1 text-xs text-indigo-600 font-semibold">(Default)</span>
                  )}
                </p>
                <p className="text-gray-600">
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city},{" "}
                  {address.state} {address.postalCode}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order history */}
      <div className="bg-white shadow rounded p-6 mt-4">
        <h2 className="text-lg font-semibold mb-3">Order History</h2>

        {orders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order._id} className="border border-gray-200 rounded p-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Order #{order._id.slice(-8)}</span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[order.status]}`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                <div className="mt-2 space-y-1">
                  {order.orderItems.map((item) => (
                    <div key={item._id} className="flex justify-between text-gray-700">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                  <span>{order.isPaid ? (
                    <span className="text-green-600">Paid</span>
                  ) : (
                    <span className="text-red-500">Payment pending</span>
                  )}</span>
                  <span className="font-semibold">₹{order.totalPrice}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCustomerDetail;