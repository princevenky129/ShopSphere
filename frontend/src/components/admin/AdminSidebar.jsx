import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ADMIN_LINKS = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/coupons", label: "Coupons" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/profile", label: "Profile" },
];

// NEW - Week 10: accepts isOpen/onClose so AdminLayout can control this
// component's visibility on mobile. On desktop (md+), these props are
// simply ignored — the sidebar is always shown via CSS, regardless of
// their values.
export default function AdminSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <>
      {/* NEW - Week 10: dark overlay behind the drawer, mobile only.
          Clicking it closes the sidebar — same "click outside to close"
          pattern as the address modal in Profile.jsx. Only rendered when
          the drawer is actually open, and only relevant below md
          (md:hidden hides it entirely on desktop, where there's no drawer). */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={
          "w-56 bg-white shadow-md min-h-screen flex flex-col " +
          // On mobile: fixed drawer that slides in/out from the left using
          // a CSS transform. translate-x-0 = on-screen, -translate-x-full =
          // pushed completely off-screen to the left. "transition-transform"
          // animates that movement smoothly instead of an instant jump.
          // On md+: none of this matters — "md:static md:translate-x-0"
          // forces it back into the normal page flow, always visible,
          // matching the original behavior exactly.
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 " +
          (isOpen ? "translate-x-0" : "-translate-x-full") +
          " md:static md:translate-x-0 md:z-auto"
        }
      >
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <span className="text-lg font-bold text-indigo-600">Admin Panel</span>
          {/* Close button only makes sense on mobile — hidden on desktop
              since the sidebar can't be "closed" there */}
          <button onClick={onClose} className="md:hidden text-xl text-gray-500">
            ✕
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {ADMIN_LINKS.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={
                  "block px-3 py-2 rounded-md text-sm font-medium " +
                  (isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t">
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}