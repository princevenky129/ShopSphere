# 🛍️ ShopSphere

🔗 **Live Demo:** [shopsphere-ecommerce-store.vercel.app](https://shopsphere-ecommerce-store.vercel.app)
*(Backend is hosted on Render's free tier — the first request after inactivity may take 30-60 seconds to wake up. Please be patient on first load!)*

A full-stack MERN e-commerce platform with JWT authentication, dual payment gateway integration (Stripe & Razorpay), a complete admin dashboard, and a responsive customer-facing storefront.

Built as a learning project to go beyond typical tutorial scope — covering everything from cart/checkout flows to admin analytics, customer management, and mobile responsiveness.

---

## ✨ Features

### Core
- User authentication (signup/login) with JWT-based sessions
- Product listing with categories, search, and filters
- Product detail pages with images, description, price, and stock
- Shopping cart (add/remove/update quantity)
- Checkout flow with order summary and saved address prefill
- **Dual payment gateways**: Stripe and Razorpay (test mode) — supports Card, UPI/Netbanking, and Cash on Delivery
- Order history for customers, with order tracking status
- Admin panel: manage products, orders, stock, and coupons

### Extended
- Wishlist
- Product reviews & ratings
- Coupon / discount codes (server-side validated)
- Email notifications on order confirmation (Nodemailer)
- Pagination & sorting (price, popularity)
- Role-based access control (customer vs. admin)
- Customer profile: editable details, saved addresses, password change, profile picture upload (Cloudinary)
- Admin customer management dashboard (order history, total spend, per-customer detail view)
- Fully responsive design, tested on physical mobile devices

---

## 🛠️ Tech Stack

**Frontend:** React.js, Tailwind CSS, React Router, Context API
**Backend:** Node.js, Express.js
**Database:** MongoDB (Mongoose)
**Auth:** JWT + bcrypt
**Payments:** Stripe & Razorpay (test mode)
**Image Uploads:** Cloudinary
**Email:** Nodemailer

**Deployment:** Frontend on Vercel, Backend on Render, Database on MongoDB Atlas

---

## 📁 Project Structure

ecommerce-app/
├── backend/
│ ├── config/ # DB & Cloudinary config
│ ├── controllers/ # Route logic
│ ├── middleware/ # Auth & upload middleware
│ ├── models/ # Mongoose schemas
│ ├── routes/ # API routes
│ ├── utils/ # Email utility
│ └── server.js
└── frontend/
└── src/
├── api/ # Axios instance
├── components/ # Reusable UI components
├── context/ # Auth context
├── layouts/ # Admin layout
└── pages/ # Route-level pages (customer + admin)

---

## 🚀 Getting Started

Want to run this locally instead of using the live demo? Follow these steps.

### Prerequisites
- Node.js (v18+)
- MongoDB (local or MongoDB Atlas)
- Stripe & Razorpay test API keys
- Gmail account with an App Password (for email notifications)
- Cloudinary account (for image uploads)

### 1. Clone the repository
```bash
git clone https://github.com/princevenky129/ShopSphere.git
cd ShopSphere
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (see `.env.example` for required variables), then start the server:
```bash
npm run dev
```
Backend runs on `http://localhost:5000`

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

---

## 🔑 Environment Variables

See `backend/.env.example` for the full list of required variables (MongoDB URI, JWT secret, Stripe/Razorpay keys, Cloudinary credentials, Gmail app password).

---

## 📌 Project Status

Feature-complete and fully deployed — all planned MVP, extended, and advanced features are implemented and live in production.

---

## 📄 License

This project is for educational/portfolio purposes.