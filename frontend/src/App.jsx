import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProductListing from "./pages/ProductListing";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCoupons from "./pages/admin/AdminCoupons";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import AuthPage from "./pages/AuthPage";
import Wishlist from "./pages/Wishlist";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile"; // NEW - Week 10
import AdminCustomers from "./pages/admin/AdminCustomers"; // NEW - Week 10
import AdminCustomerDetail from "./pages/admin/AdminCustomerDetail"; // NEW - Week 10
import FloatingHomeButton from "./components/FloatingHomeButton"; // NEW - Week 10

function App() {
  return (
    <>
      <Navbar />
      <FloatingHomeButton />
      <Routes>
      <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProductListing />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* :token is a route parameter — ResetPassword.jsx reads it via useParams() */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />
        {/* NEW - Week 10: customer-facing profile page */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout>
                <AdminProducts />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout>
                <AdminOrders />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout>
                <AdminCoupons />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        {/* NEW - Week 10: admin's own (simpler) profile page — same component, reused */}
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout>
                <Profile />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        {/* NEW - Week 10: Customer Management */}
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout>
                <AdminCustomers />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers/:id"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout>
                <AdminCustomerDetail />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;