# ShopKart

A full-stack (MERN) e-commerce app built across six engineering labs: authentication, product catalogue, wishlist, shopping cart, and checkout with Razorpay (Test Mode) payments.

## Tech stack

- **Backend:** Node.js, Express 5, MongoDB with Mongoose, bcrypt, jsonwebtoken, cookie-parser, Razorpay
- **Frontend:** React 19, React Router 7, Axios, Vite, plain CSS
- **Auth:** JWT stored in an HttpOnly cookie
- **Cart state:** React Context API

## Features

| Lab | Feature |
| --- | --- |
| 01 | Register, login, logout, protected profile (`/customers/me`) |
| 02 | React login / register / home pages with protected routes |
| 03 | Product catalogue with search, category filter and price sort |
| 04 | Wishlist stored as Product references (`populate()`) |
| 05 | Cart with quantities, stock checks, live navbar count (Context API) |
| 06 | Checkout, Razorpay Test Mode payment, signature verification, order history |

## Project structure

```
shopkart/
├── backend/
│   ├── config/        db.js, razorpay.js
│   ├── controllers/   customer, product, wishlist, cart, order
│   ├── middlewares/   auth.middleware.js
│   ├── models/        customer, product, order
│   ├── routes/
│   ├── seed/          products.seed.js
│   ├── utils/         generateToken.js
│   └── index.js
└── frontend/
    └── src/
        ├── components/
        ├── context/   CartContext.jsx
        ├── pages/
        ├── services/  api.js
        └── utils/
```

## Running locally

You need Node.js 18+ and MongoDB running on `localhost:27017`.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `backend/.env`:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shopkart
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=7d
NODE_ENV=development
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

Use Razorpay **Test Mode** keys only (Dashboard → Test Mode → API Keys). The key secret stays on the backend and is never sent to the browser.

Load the sample products, then start the server:

```bash
npm run seed
npm run dev
```

The API runs on http://localhost:5000.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server forwards `/api/*` requests to the backend, so the frontend and API share one origin and the login cookie works without CORS.

## API

All routes except register, login and the product routes need the login cookie (or `Authorization: Bearer <token>`).

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/customers/register` | Create an account |
| POST | `/customers/login` | Log in (sets the HttpOnly cookie) |
| GET | `/customers/me` | Current customer |
| POST | `/customers/logout` | Clear the cookie |
| PATCH | `/customers/change-password` | Change password |
| GET | `/products?search=&category=&sort=` | List products (`sort`: `price_asc`, `price_desc`) |
| GET | `/products/:id` | One product |
| POST | `/products` | Create a product |
| GET | `/wishlist` | Current customer's wishlist |
| POST / DELETE | `/wishlist/:productId` | Add / remove |
| PATCH | `/wishlist/:productId/toggle` | Add if missing, remove if present |
| GET | `/cart` | Current customer's cart |
| POST | `/cart/:productId` | Add one unit |
| PATCH | `/cart/:productId` | Set quantity: `{ "quantity": 3 }` |
| DELETE | `/cart/:productId` | Remove |
| POST | `/orders/create-payment-order` | Validate cart, create pending order + Razorpay order |
| POST | `/orders/verify-payment` | Verify Razorpay signature, mark paid, clear cart |
| GET | `/orders` | Current customer's paid orders |
| GET | `/orders/:id` | One order (only the owner's) |
| PATCH | `/orders/:id/status` | Development only: move status forward |

## Payment flow

1. The frontend sends only the shipping address.
2. The server reloads the cart's products, re-checks stock, calculates the total and creates a pending order plus a Razorpay order (amount in paise).
3. Razorpay Checkout opens in the browser.
4. After payment, the server verifies Razorpay's HMAC-SHA256 signature using the saved Razorpay order ID.
5. Only then is the order marked PAID / PLACED, stock reduced and the cart cleared.

Orders store a snapshot of each product's name, price and image, so order history doesn't change when products do.
