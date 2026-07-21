import { useState } from "react";
import AdminSidebar from "../components/admin/AdminSidebar";

// This wraps any admin page with the sidebar on the left.
// "children" is whatever page component gets passed in — e.g. <AdminDashboard />
export default function AdminLayout({ children }) {
  // NEW - Week 10: controls the sidebar drawer on mobile. Lives here
  // (not inside AdminSidebar itself) because the hamburger button that
  // toggles it needs to live in a top bar ABOVE the sidebar, in this
  // same layout — so the state has to be shared between the two.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="md:flex">
      {/* NEW - Week 10: mobile-only top bar with a hamburger button.
          Hidden entirely on md+ screens, where the sidebar is always visible. */}
      <div className="md:hidden flex items-center justify-between bg-white shadow-md px-4 py-3">
        <span className="text-lg font-bold text-indigo-600">Admin Panel</span>
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-2xl text-gray-700"
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>

      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">{children}</div>
    </div>
  );
}