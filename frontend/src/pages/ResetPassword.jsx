import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const ResetPassword = () => {
  // useParams() reads dynamic segments from the URL — same idea as
  // useSearchParams reading "?search=" in ProductListing.jsx, but for
  // path segments like "/reset-password/:token". This route is defined
  // in App.jsx as path="/reset-password/:token", so useParams() gives us
  // { token: "whatever-was-in-that-part-of-the-url" }.
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Simple client-side check before even hitting the backend —
    // catches typos early, saves a round trip for an obvious mistake.
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.put(`/auth/reset-password/${token}`, {
        password,
      });
      setMessage(response.data.message);

      // Give the user a moment to read the success message, then send
      // them to the login page to sign in with their new password.
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const errMessage =
        err.response?.data?.message ||
        "This reset link is invalid or has expired. Please request a new one.";
      setError(errMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>

        {error && (
          <div className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">
            {error}
            {/* If the link is invalid/expired, point them back to request a fresh one */}
            <div className="mt-2">
              <Link to="/forgot-password" className="underline font-medium">
                Request a new reset link
              </Link>
            </div>
          </div>
        )}

        {message && (
          <div className="bg-green-100 text-green-700 text-sm p-2 rounded mb-4">
            {message} Redirecting to login...
          </div>
        )}

        {/* Only show the form if we haven't already succeeded — no point
            letting someone resubmit after a successful reset. */}
        {!message && (
          <>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label className="block mb-2 text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default ResetPassword;