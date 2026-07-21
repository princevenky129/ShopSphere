import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // NEW - Week 10: controls whether the mobile dropdown menu is open.
  // Only relevant below the "md" breakpoint — on desktop this is ignored
  // entirely since the menu is always visible there.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?search=${encodeURIComponent(searchTerm)}`);
    setMobileMenuOpen(false); // close the menu after searching, on mobile
  };

  // Closes the mobile menu whenever a nav link is clicked — otherwise
  // it would stay open after navigating to the new page, which feels broken.
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/forgot-password" ||
    location.pathname.startsWith("/reset-password");

  const isAdmin = user && user.role === "admin";

  // Whether there's anything to show on the right side at all —
  // used to decide whether the hamburger button should render
  const showNavLinks = !isAuthPage && !isAdmin;

  return (
    <nav className="bg-white shadow-md px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-indigo-600" onClick={closeMobileMenu}>
          ShopSphere
        </Link>

        {/* CHANGED - Week 10: search bar is now ALWAYS visible, at every
            screen size — only the nav links (Cart/Wishlist/etc) collapse
            into the hamburger menu below. "flex-1" lets it stretch to
            fill the available space between the logo and hamburger/links. */}
        {showNavLinks && (
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-3 sm:mx-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>
        )}

        {/* Desktop nav links — hidden below md, shown at md and up */}
        {showNavLinks && (
          <div className="hidden md:flex items-center gap-4 text-sm">
            <Link to="/cart" className="text-gray-700 hover:text-indigo-600">
              Cart
            </Link>
            {user ? (
              <>
                <Link to="/wishlist" className="text-gray-700 hover:text-indigo-600">
                  Wishlist
                </Link>
                <Link to="/my-orders" className="text-gray-700 hover:text-indigo-600">
                  My Orders
                </Link>
                <Link to="/profile" className="text-gray-700 hover:text-indigo-600">
                  Profile
                </Link>
                <button onClick={logout} className="text-gray-700 hover:text-red-600">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="text-gray-700 hover:text-indigo-600">
                Login
              </Link>
            )}
          </div>
        )}

        {/* NEW - Week 10: Hamburger button — only visible below md,
            and only when there's actually a menu worth opening */}
        {showNavLinks && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-2xl text-gray-700 px-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        )}
      </div>

      {/* NEW - Week 10: Mobile dropdown panel — only renders when open,
          and only ever shows below md (the "md:hidden" wrapper above
          the desktop version means these two never show at the same time) */}
      {showNavLinks && mobileMenuOpen && (
        <div className="md:hidden mt-3 pb-2 border-t border-gray-100 pt-3">
          <div className="flex flex-col gap-3 text-sm">
            <Link to="/cart" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600">
              Cart
            </Link>
            {user ? (
              <>
                <Link to="/wishlist" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600">
                  Wishlist
                </Link>
                <Link to="/my-orders" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600">
                  My Orders
                </Link>
                <Link to="/profile" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600">
                  Profile
                </Link>
                <button
                  onClick={() => {
                    closeMobileMenu();
                    logout();
                  }}
                  className="text-left text-gray-700 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600">
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}