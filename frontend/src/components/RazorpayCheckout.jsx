import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

export default function RazorpayCheckout({ order }) {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    setProcessing(true);
    setError("");

    try {
      // Step 1: ask our backend to create a Razorpay order for this order
      const { data } = await axiosInstance.post("/payment/create-razorpay-order", {
        orderId: order._id,
      });

      // Step 2: configure and open the Razorpay popup.
      // This "options" object is Razorpay's required format — most of
      // these fields are just for how the popup LOOKS (name, description),
      // but razorpay_order_id, amount, currency, and key must exactly
      // match what our backend just created, or Razorpay will reject it.
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: "ShopSphere",
        description: `Order #${order._id.slice(-8)}`,
        // handler runs automatically the MOMENT the customer completes
        // payment successfully inside the popup. Razorpay hands us back
        // three values here — we send all three to our backend, which
        // verifies them using the signature check (HMAC) before trusting
        // that the payment really happened.
        handler: async function (response) {
          try {
            await axiosInstance.post("/payment/verify-razorpay-payment", {
              orderId: order._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            navigate("/my-orders");
          } catch (err) {
            setError("Payment succeeded but verification failed. Please contact support.");
          }
        },
        // Prefill isn't required, but improves UX — Razorpay's popup can
        // pre-fill the customer's name/contact if we already know it,
        // from the shipping address on this order.
        prefill: {
          name: order.shippingAddress?.fullName || "",
          contact: order.shippingAddress?.phone || "",
        },
        theme: {
          color: "#4f46e5", // matches your indigo-600 buttons elsewhere
        },
        // modal.ondismiss runs if the customer closes the popup WITHOUT
        // paying (clicks the X, presses Escape, etc) — we just reset our
        // "processing" state so the Pay button becomes clickable again.
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      // window.Razorpay comes from the <script> tag we added to index.html —
      // it's not something we import, it's just globally available.
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      setError("Could not start payment. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <div className="mt-6">
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <button
        onClick={handlePay}
        disabled={processing}
        className="w-full bg-indigo-600 text-white py-2.5 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {processing ? "Opening payment..." : `Pay ₹${order.totalPrice} via UPI/Netbanking`}
      </button>
    </div>
  );
}