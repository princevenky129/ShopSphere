import { createContext, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

// 1. Create the context (like a "global box" to store data)
const AuthContext = createContext();

// 2. Create a Provider component - this wraps our whole app
export const AuthProvider = ({ children }) => {
  // Try to load user info from localStorage when app first loads
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // useNavigate lets us redirect the user in code, not just via <Link>.
  // This only works because AuthProvider is rendered inside <BrowserRouter>
  // in main.jsx — useNavigate needs to be inside the Router to function.
  const navigate = useNavigate();

  // Called after successful login
  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // Called on logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);

    // send the user back to the login page after logging out,
    // so they don't end up stuck on a page that expects a logged-in user.
    navigate("/login");
  };

  // NEW - Week 10: called after the Profile page successfully updates
  // name/email/profilePicture, so the rest of the app (Navbar, etc.)
  // reflects the change immediately without needing to log out and back in.
  // "updatedFields" is a partial object, e.g. { name: "New Name" } —
  // we merge it into the existing user object rather than replacing it entirely.
  const updateUser = (updatedFields) => {
    setUser((prevUser) => {
      const newUser = { ...prevUser, ...updatedFields };
      localStorage.setItem("user", JSON.stringify(newUser));
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Custom hook so components can easily access auth data
export const useAuth = () => useContext(AuthContext);