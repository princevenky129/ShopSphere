import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import App from "./App.jsx";

// loadStripe connects to Stripe using your PUBLIC key (safe for the browser).
// This only needs to run once, outside the component tree.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Elements stripe={stripePromise}>
          <App />
        </Elements>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);