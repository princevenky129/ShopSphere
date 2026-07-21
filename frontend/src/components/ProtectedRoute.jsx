import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();

  // Not logged in at all -> send to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in, but this route requires admin and user isn't one
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // All checks passed -> render the actual page
  return children;
};

export default ProtectedRoute;