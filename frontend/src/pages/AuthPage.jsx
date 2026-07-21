import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const AuthPage = () => {
  // isSignup toggles which form is shown. true = signup, false = login.
  const [isSignup, setIsSignup] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Pick the endpoint based on which mode we're in.
      // Both /auth/register and /auth/login return the same flat shape,
      // so the rest of the logic below is identical either way.
      const endpoint = isSignup ? "/auth/register" : "/auth/login";
      const payload = isSignup ? { name, email, password } : { email, password };

      const response = await axiosInstance.post(endpoint, payload);

      const { token, ...user } = response.data;
      login(user, token);

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/"); // regular customer -> homepage
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Switching modes clears the form and any leftover error message,
  // so a stale "Invalid password" doesn't linger when someone switches to Signup.
  const toggleMode = () => {
    setIsSignup((prev) => !prev);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    // CHANGED - Week 10: was "min-h-screen" (100% of the browser viewport),
    // which double-counted the Navbar's own height sitting above this page,
    // causing the whole page to be taller than the screen and scroll.
    // "calc(100vh-64px)" subtracts the Navbar's approximate height, so this
    // container exactly fills the REMAINING space below it — no more, no less.
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isSignup ? "Create Account" : "ShopSphere Login"}
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">
            {error}
          </div>
        )}

        {/* Name field only shows in signup mode */}
        {isSignup && (
          <>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </>
        )}

        <label className="block mb-2 text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="block mb-2 text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* NEW: only show "Forgot password?" in login mode — makes no
            sense to show it while someone is signing up for the first time */}
        {!isSignup && (
          <div className="text-right mb-4">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 ${isSignup ? "mt-4" : ""}`}
        >
          {loading
            ? isSignup
              ? "Creating account..."
              : "Logging in..."
            : isSignup
            ? "Sign Up"
            : "Login"}
        </button>

        <p className="text-sm text-center text-gray-600 mt-4">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={toggleMode}
            className="text-blue-600 hover:underline font-medium"
          >
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </p>
      </form>
    </div>
  );
};

export default AuthPage;