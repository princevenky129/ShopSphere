import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import CheckoutForm from "../components/CheckoutForm";
import RazorpayCheckout from "../components/RazorpayCheckout"; // NEW - Week 10

const EMPTY_ADDRESS = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

export default function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [order, setOrder] = useState(null); // becomes non-null once order is placed
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  // --- Coupons ---
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  // --- Shipping address ---
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState(EMPTY_ADDRESS);
  const [addressError, setAddressError] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  // --- NEW - Week 10: Payment method ---
  // 'card' = Stripe, 'upi_netbanking' = Razorpay (not wired up yet),
  // 'cod' = Cash on Delivery. Defaults to 'card' since that's the one
  // that's always been available.
  const [paymentMethod, setPaymentMethod] = useState("card");

  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const [cartRes, profileRes] = await Promise.all([
          axiosInstance.get("/cart"),
          axiosInstance.get("/users/profile"),
        ]);

        setCart(cartRes.data);

        const fetchedAddresses = profileRes.data.addresses || [];
        setAddresses(fetchedAddresses);

        const defaultAddress = fetchedAddresses.find((a) => a.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
        } else if (fetchedAddresses.length > 0) {
          setSelectedAddressId(fetchedAddresses[0]._id);
        }
      } catch (err) {
        setError("Could not load checkout details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCheckoutData();
  }, []);

  const items = cart?.items || [];
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  let discountPreview = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percentage") {
      discountPreview = (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      discountPreview = appliedCoupon.discountValue;
    }
    if (discountPreview > subtotal) discountPreview = subtotal;
  }
  const total = subtotal - discountPreview;

  const handleApplyCoupon = async () => {
    setCouponError("");
    if (!couponInput.trim()) return;

    setCheckingCoupon(true);
    try {
      const response = await axiosInstance.post("/coupons/validate", {
        code: couponInput.trim(),
      });
      setAppliedCoupon(response.data);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || "Could not apply coupon.");
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const selectedAddress = addresses.find((a) => a._id === selectedAddressId) || null;

  const handlePickAddress = (addressId) => {
    setSelectedAddressId(addressId);
    setShowAddressPicker(false);
  };

  const openAddAddressModal = () => {
    setNewAddressForm(EMPTY_ADDRESS);
    setAddressError("");
    setShowAddAddressModal(true);
  };

  const closeAddAddressModal = () => {
    setShowAddAddressModal(false);
    setAddressError("");
  };

  const handleNewAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddressForm({
      ...newAddressForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSaveNewAddress = async (e) => {
    e.preventDefault();
    setAddressError("");
    setSavingAddress(true);

    try {
      const res = await axiosInstance.post("/users/addresses", newAddressForm);
      setAddresses(res.data);
      const newlyAdded = res.data[res.data.length - 1];
      setSelectedAddressId(newlyAdded._id);
      setShowAddAddressModal(false);
      setShowAddressPicker(false);
    } catch (err) {
      setAddressError(err.response?.data?.message || "Failed to save address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError("Please add or select a shipping address before placing your order.");
      return;
    }

    setPlacingOrder(true);
    setError("");
    try {
      const body = {
        shippingAddress: {
          fullName: selectedAddress.fullName,
          phone: selectedAddress.phone,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country,
        },
        paymentMethod, // NEW - Week 10
      };
      if (appliedCoupon) {
        body.couponCode = appliedCoupon.code;
      }
      const response = await axiosInstance.post("/orders", body);
      setOrder(response.data);

      // NEW - Week 10: COD orders need no payment step at all — the order
      // is complete the moment it's created. Card orders still need the
      // Stripe form (CheckoutForm), which we show below when order is set.
      if (paymentMethod === "cod") {
        navigate("/my-orders");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not place order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) return <p className="text-center py-10 text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>

      {items.length === 0 && !order ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          {/* Shipping Address */}
          {!order && (
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Shipping Address</h2>

              {selectedAddress ? (
                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{selectedAddress.fullName}</p>
                      <p className="text-gray-600">{selectedAddress.phone}</p>
                      <p className="text-gray-600">
                        {selectedAddress.addressLine1}
                        {selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ""}
                      </p>
                      <p className="text-gray-600">
                        {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddressPicker(!showAddressPicker)}
                      className="text-xs text-indigo-600 hover:underline whitespace-nowrap"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                  You don't have a saved address yet. Please add one to continue.
                </div>
              )}

              {(showAddressPicker || !selectedAddress) && (
                <div className="mt-3 space-y-2">
                  {addresses.map((address) => (
                    <button
                      key={address._id}
                      onClick={() => handlePickAddress(address._id)}
                      className={
                        "w-full text-left border rounded p-3 text-sm " +
                        (address._id === selectedAddressId
                          ? "border-indigo-400 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300")
                      }
                    >
                      <p className="font-medium">
                        {address.fullName}{" "}
                        {address.isDefault && (
                          <span className="ml-1 text-xs text-indigo-600 font-semibold">
                            (Default)
                          </span>
                        )}
                      </p>
                      <p className="text-gray-600">
                        {address.addressLine1}, {address.city}, {address.state} {address.postalCode}
                      </p>
                    </button>
                  ))}

                  <button
                    onClick={openAddAddressModal}
                    className="w-full text-sm text-indigo-600 hover:underline text-left px-1 py-1"
                  >
                    + Add a new address
                  </button>
                </div>
              )}
            </div>
          )}

          {/* NEW - Week 10: Payment Method selector */}
          {!order && (
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Payment Method</h2>

              <div className="space-y-2">
                <label
                  className={
                    "flex items-center gap-3 border rounded p-3 text-sm cursor-pointer " +
                    (paymentMethod === "card"
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300")
                  }
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>💳 Card (Credit/Debit)</span>
                </label>

                <label
                  className={
                    "flex items-center gap-3 border rounded p-3 text-sm cursor-pointer " +
                    (paymentMethod === "upi_netbanking"
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300")
                  }
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi_netbanking"
                    checked={paymentMethod === "upi_netbanking"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>📱 UPI / Netbanking</span>
                </label>

                <label
                  className={
                    "flex items-center gap-3 border rounded p-3 text-sm cursor-pointer " +
                    (paymentMethod === "cod"
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300")
                  }
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>💵 Cash on Delivery</span>
                </label>
              </div>
            </div>
          )}

          {/* Order summary */}
          <div className="space-y-3 border-b border-gray-200 pb-4">
            {items.map((item) => (
              <div key={item.product._id} className="flex justify-between text-sm">
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <span>₹{item.product.price * item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Coupon section */}
          {!order && (
            <div className="border-b border-gray-200 py-4">
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Have a coupon?"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={checkingCoupon || !couponInput.trim()}
                    className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
                  >
                    {checkingCoupon ? "Checking..." : "Apply"}
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm">
                  <span>
                    Coupon <strong>{appliedCoupon.code}</strong> applied
                  </span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-green-700 underline text-xs"
                  >
                    Remove
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-red-500 text-sm mt-2">{couponError}</p>
              )}
            </div>
          )}

          {/* Totals */}
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({appliedCoupon.code})</span>
                <span>−₹{discountPreview.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg pt-1">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

          {/* Step 1: place the order */}
          {!order && (
            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder || !selectedAddress}
              className="w-full mt-6 bg-indigo-600 text-white py-2.5 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {placingOrder
                ? "Placing order..."
                : paymentMethod === "cod"
                ? "Place Order (Pay on Delivery)"
                : "Continue to Payment"}
            </button>
          )}

{/* Step 2: only Card and UPI/Netbanking orders need a payment
              step here. COD orders never reach this point —
              handlePlaceOrder already redirected to /my-orders as soon
              as the order was created. */}
          {order && paymentMethod === "card" && <CheckoutForm order={order} />}
          {order && paymentMethod === "upi_netbanking" && <RazorpayCheckout order={order} />}
        </>
      )}

      {/* Add New Address modal */}
      {showAddAddressModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeAddAddressModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Add New Address</h3>

            <form onSubmit={handleSaveNewAddress} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Full Name</label>
                <input
                  name="fullName"
                  value={newAddressForm.fullName}
                  onChange={handleNewAddressChange}
                  required
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Phone</label>
                <input
                  name="phone"
                  value={newAddressForm.phone}
                  onChange={handleNewAddressChange}
                  required
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Address Line 1</label>
                <input
                  name="addressLine1"
                  value={newAddressForm.addressLine1}
                  onChange={handleNewAddressChange}
                  required
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Address Line 2 <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  name="addressLine2"
                  value={newAddressForm.addressLine2}
                  onChange={handleNewAddressChange}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">City</label>
                  <input
                    name="city"
                    value={newAddressForm.city}
                    onChange={handleNewAddressChange}
                    required
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">State</label>
                  <input
                    name="state"
                    value={newAddressForm.state}
                    onChange={handleNewAddressChange}
                    required
                    className="border p-2 rounded w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Postal Code</label>
                  <input
                    name="postalCode"
                    value={newAddressForm.postalCode}
                    onChange={handleNewAddressChange}
                    required
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Country</label>
                  <input
                    name="country"
                    value={newAddressForm.country}
                    onChange={handleNewAddressChange}
                    required
                    className="border p-2 rounded w-full"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={newAddressForm.isDefault}
                  onChange={handleNewAddressChange}
                />
                Set as default address
              </label>

              {addressError && <p className="text-sm text-red-600">{addressError}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingAddress ? "Saving..." : "Save & Use This Address"}
                </button>
                <button
                  type="button"
                  onClick={closeAddAddressModal}
                  className="border px-4 py-2 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}