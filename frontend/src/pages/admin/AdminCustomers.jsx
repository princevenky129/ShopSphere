import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/admin/customers", {
        params: { page, limit: LIMIT },
      });
      setCustomers(res.data.customers);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  // Formats a date string like "18 Jul 2026", matching the style
  // shown in your Week 10 plan's example table
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Customers</h1>

      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}

      {loading ? (
        <p>Loading customers...</p>
      ) : (
        <>
          <table className="w-full bg-white shadow rounded">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Last Updated</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Total Spent</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer._id} className="border-b">
                  <td className="p-3">{customer.name}</td>
                  <td className="p-3">{customer.email}</td>
                  <td className="p-3">{formatDate(customer.createdAt)}</td>
                  <td className="p-3">{formatDate(customer.updatedAt)}</td>
                  <td className="p-3">{customer.totalOrders}</td>
                  <td className="p-3">₹{customer.totalSpent.toFixed(2)}</td>
                  <td className="p-3">
                    <Link
                      to={`/admin/customers/${customer._id}`}
                      className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {customers.length === 0 && (
            <p className="text-center text-gray-500 py-6">No customers yet.</p>
          )}

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

export default AdminCustomers;