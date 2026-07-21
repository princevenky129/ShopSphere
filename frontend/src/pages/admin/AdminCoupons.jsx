import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    expiresAt: "",
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/coupons");
      setCoupons(res.data);
    } catch (err) {
      setError("Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({ code: "", discountType: "percentage", discountValue: "", expiresAt: "" });
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Coupons are create-only in this app — no "edit", unlike products.
      // If expiresAt is left blank, don't send an empty string (backend
      // treats an empty expiresAt as "no expiry" only if the key is omitted).
      const payload = {
        code: formData.code,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
      };
      if (formData.expiresAt) {
        payload.expiresAt = formData.expiresAt;
      }

      await axiosInstance.post("/coupons", payload);
      resetForm();
      fetchCoupons();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create coupon.");
    }
  };

  const handleDeactivate = async (id) => {
    const confirmDeactivate = window.confirm("Deactivate this coupon? It will no longer be usable at checkout.");
    if (!confirmDeactivate) return;

    try {
      await axiosInstance.put("/coupons/" + id + "/deactivate");
      fetchCoupons();
    } catch (err) {
      setError("Failed to deactivate coupon.");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Coupons</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {showForm ? "Cancel" : "Add Coupon"}
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-2 gap-4">
          <input
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="Coupon code (e.g. SAVE10)"
            required
            className="border p-2 rounded"
          />

          <select
            name="discountType"
            value={formData.discountType}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="percentage">Percentage off (%)</option>
            <option value="flat">Flat amount off (₹)</option>
          </select>

          <input
            name="discountValue"
            value={formData.discountValue}
            onChange={handleChange}
            placeholder={formData.discountType === "percentage" ? "e.g. 10 (for 10%)" : "e.g. 100 (for ₹100 off)"}
            type="number"
            required
            className="border p-2 rounded"
          />

          <input
            name="expiresAt"
            value={formData.expiresAt}
            onChange={handleChange}
            type="date"
            className="border p-2 rounded"
          />

          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 col-span-2">
            Create Coupon
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading coupons...</p>
      ) : (
        <table className="w-full bg-white shadow rounded">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Code</th>
              <th className="p-3">Type</th>
              <th className="p-3">Value</th>
              <th className="p-3">Expires</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon._id} className="border-b">
                <td className="p-3 font-medium">{coupon.code}</td>
                <td className="p-3">{coupon.discountType === "percentage" ? "Percentage" : "Flat"}</td>
                <td className="p-3">
                  {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                </td>
                <td className="p-3">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "—"}</td>
                <td className="p-3">
                  {coupon.isActive ? (
                    <span className="text-green-700 bg-green-100 px-2 py-1 rounded text-xs">Active</span>
                  ) : (
                    <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded text-xs">Inactive</span>
                  )}
                </td>
                <td className="p-3">
                  {coupon.isActive && (
                    <button
                      onClick={() => handleDeactivate(coupon._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminCoupons;