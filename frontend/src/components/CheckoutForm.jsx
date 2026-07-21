import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import axiosInstance from "../api/axiosInstance";

export default function CheckoutForm({ order }) {
  const stripe = useStripe();     // gives access to Stripe's methods
  const elements = useElements(); // gives access to the CardElement's data
  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async (e) => {
    e.preventDefault(); // stop the form from doing a full page reload

    if (!stripe || !elements) {
      // Stripe.js hasn't finished loading yet — guard against clicking too early
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // Step 1: ask our backend to create a Stripe PaymentIntent for this order
      const { data } = await axiosInstance.post("/payment/create-payment-intent", {
        orderId: order._id,
      });
      const clientSecret = data.clientSecret;

      // Step 2: use Stripe.js to actually confirm the card payment.
      // This is the step that securely sends card details straight to
      // Stripe's servers — your backend and your own code never see or
      // touch the raw card number.
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        // Card was declined, or details were invalid, etc.
        setError(result.error.message);
        setProcessing(false);
        return;
      }

      if (result.paymentIntent.status === "succeeded") {
        // Step 3: tell our OWN backend the payment succeeded, so it can
        // independently verify with Stripe and mark the order as paid.
        await axiosInstance.post("/payment/confirm-payment", {
          orderId: order._id,
          paymentIntentId: result.paymentIntent.id,
        });

        // Success! Send the user to their order history.
        navigate("/my-orders");
      }
    } catch (err) {
      setError("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="mt-6">
      <div className="border border-gray-300 rounded-md p-3">
        {/* CardElement is Stripe's pre-built, secure card input.
            It renders card number, expiry, and CVC in one widget.
            We never see or handle the raw card data ourselves. */}
        <CardElement
          options={{
            style: {
              base: { fontSize: "16px", color: "#1f2937" },
            },
          }}
        />
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full mt-4 bg-indigo-600 text-white py-2.5 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {processing ? "Processing..." : `Pay ₹${order.totalPrice}`}
      </button>
    </form>
  );
}