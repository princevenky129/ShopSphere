import { Link, useLocation } from "react-router-dom";

// NEW - Week 10: a persistent, always-visible button that jumps straight
// to the homepage from anywhere in the app — useful on mobile where
// there's no easy "back to start" gesture, especially after navigating
// several levels deep (category -> product -> checkout -> payment, etc).
export default function FloatingHomeButton() {
  const location = useLocation();

  // Don't show it on admin pages (they already have "Dashboard" in the
  // sidebar for this), or on pre-login pages (nothing to "go home" to yet).
  const isAdminPage = location.pathname.startsWith("/admin");
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/forgot-password" ||
    location.pathname.startsWith("/reset-password");

  // Also skip rendering it on the homepage itself — no point showing a
  // "go home" button when you're already there.
  const isHomePage = location.pathname === "/";

  if (isAdminPage || isAuthPage || isHomePage) {
    return null;
  }

  return (
    <Link
      to="/"
      // fixed + bottom-6 right-6: pins it to the bottom-right corner of
      // the VIEWPORT (not the page), so it stays in place even while
      // scrolling. z-30 keeps it above normal page content, but below
      // the address modal (z-50) and admin sidebar drawer (z-50) so it
      // doesn't visually clash with those when they're open.
      className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center text-xl hover:bg-indigo-700"
      aria-label="Go to homepage"
    >
      🏠
    </Link>
  );
}