import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/analytics");
      setAnalytics(res.data);
    } catch (err) {
      setError("Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status) => {
    if (status === "pending") return "bg-yellow-100 text-yellow-700";
    if (status === "shipped") return "bg-blue-100 text-blue-700";
    if (status === "delivered") return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-700";
  };

  if (loading) return <div className="p-6">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!analytics) return null;

  const { totalRevenue, totalOrders, ordersByStatus, topProducts, lowStockProducts, revenueOverTime } =
    analytics;

  // For the bar chart: find the highest single day's revenue so we can
  // scale every bar's height as a percentage relative to that max.
  // Without this, a ₹500 day and a ₹20000 day would look identical.
  const maxRevenue = Math.max(...revenueOverTime.map((d) => d.revenue), 1);
  // maxRevenue defaults to at least 1 to avoid dividing by zero if there's no data at all

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white shadow rounded p-4">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">₹{totalRevenue}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <p className="text-sm text-gray-500">Pending Orders</p>
          <p className="text-2xl font-bold text-yellow-600">{ordersByStatus.pending}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <p className="text-sm text-gray-500">Delivered Orders</p>
          <p className="text-2xl font-bold text-green-600">{ordersByStatus.delivered}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Orders by status */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="font-semibold mb-3">Orders by Status</h2>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(ordersByStatus).map(([status, count]) => (
              <span
                key={status}
                className={"px-3 py-1 rounded text-sm font-medium " + statusColor(status)}
              >
                {status}: {count}
              </span>
            ))}
          </div>
        </div>

        {/* Revenue over time - simple bar chart */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="font-semibold mb-3">Revenue (Last 7 Days)</h2>
          {revenueOverTime.length === 0 ? (
            <p className="text-sm text-gray-500">No revenue data yet.</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {revenueOverTime.map((day) => (
                <div key={day._id} className="flex-1 flex flex-col items-center justify-end h-full">
                  {/* Bar height is a % of the tallest bar, so it's always visually scaled correctly */}
                  <div
                    className="w-full bg-indigo-500 rounded-t"
                    style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                    title={`₹${day.revenue}`}
                  />
                  <span className="text-[10px] text-gray-500 mt-1">
                    {day._id.slice(5)} {/* shows "07-19" instead of full date */}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top-selling products */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="font-semibold mb-3">Top-Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-500">No sales data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-gray-500">
                  <th className="py-2">Product</th>
                  <th className="py-2">Units Sold</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p._id} className="border-b">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2">{p.totalSold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Low stock alerts */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="font-semibold mb-3">Low Stock Alerts</h2>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-500">All products are well stocked.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-gray-500">
                  <th className="py-2">Product</th>
                  <th className="py-2">Stock Left</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((p) => (
                  <tr key={p._id} className="border-b">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-red-600 font-medium">{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;