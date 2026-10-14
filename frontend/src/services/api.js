import axios from 'axios'

// One axios instance for every backend call.
// withCredentials: true makes the browser send (and accept) the HttpOnly
// auth cookie on every request.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// ---------- Customers ----------
export const registerCustomer = (data) => api.post('/customers/register', data)

export const loginCustomer = (data) => api.post('/customers/login', data)

export const getMe = () => api.get('/customers/me')

export const logoutCustomer = () => api.post('/customers/logout')

// ---------- Products ----------
// params = { search, category, sort }. axios turns this into a query string,
// e.g. /products?search=phone&category=Electronics. Empty values are dropped.
export const getProducts = (params) => {
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([, value]) => value))
  return api.get('/products', { params: cleanParams })
}

export const getProductById = (id) => api.get(`/products/${id}`)

// ---------- Wishlist ----------
// No user ID is ever sent: the backend reads it from the auth cookie.
export const getWishlist = () => api.get('/wishlist')

export const addToWishlist = (productId) => api.post(`/wishlist/${productId}`)

export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`)

// ---------- Cart ----------
// Every cart call returns the whole updated cart, so the frontend can
// replace its state with exactly what the server has.
export const getCart = () => api.get('/cart')

export const addToCart = (productId) => api.post(`/cart/${productId}`)

export const updateCartQuantity = (productId, quantity) =>
  api.patch(`/cart/${productId}`, { quantity })

export const removeFromCart = (productId) => api.delete(`/cart/${productId}`)

// ---------- Orders ----------
// Only the shipping address is sent. The server works out the items, prices
// and total from the cart it already has.
export const createPaymentOrder = (shippingAddress) =>
  api.post('/orders/create-payment-order', { shippingAddress })

// The three values Razorpay Checkout gives us after payment, for the server to verify
export const verifyPayment = (data) => api.post('/orders/verify-payment', data)

export const getOrders = () => api.get('/orders')

export const getOrderById = (id) => api.get(`/orders/${id}`)

export default api
