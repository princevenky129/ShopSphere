import { useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await axiosInstance.post("/auth/forgot-password", { email });
      // The backend always sends back the same generic message, whether or
      // not the email actually exists in the system — that's intentional
      // (see the backend controller notes), so we just display it as-is.
      setMessage(response.data.message);
    } catch (err) {
      const errMessage =
        err.response?.data?.message || "Something went wrong. Please try again.";
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
        <h1 className="text-2xl font-bold mb-2 text-center">Forgot Password</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter your email and we'll send you a reset link.
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-100 text-green-700 text-sm p-2 rounded mb-4">
            {message}
          </div>
        )}

        <label className="block mb-2 text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <p className="text-sm text-center text-gray-600 mt-4">
          Remembered your password?{" "}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Back to Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;