import { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import { CartProvider } from '../context/CartContext.jsx'
import { getMe, getWishlist } from '../services/api.js'

// Wraps every page that needs a logged-in customer (/home, /products, ...).
// It asks the backend who is logged in (GET /customers/me). If the cookie is
// missing or invalid the backend answers 401 and we send the user to /login.
// Child pages read { user, refreshWishlistCount } with useOutletContext(),
// and the shared cart with useCart().
function ProtectedLayout() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [wishlistCount, setWishlistCount] = useState(null)

  // The navbar count always comes from the backend. Pages call this after
  // they add or remove a wishlist item.
  const refreshWishlistCount = useCallback(() => {
    getWishlist()
      .then((res) => setWishlistCount(res.data.count))
      .catch(() => setWishlistCount(null)) // just hide the count if it fails
  }, [])

  useEffect(() => {
    getMe()
      .then((res) => {
        setUser(res.data)
        refreshWishlistCount()
      })
      .catch(() => navigate('/login', { replace: true }))
  }, [navigate, refreshWishlistCount])

  if (!user) {
    return <div className="loading">Loading...</div>
  }

  return (
    // CartProvider loads the cart once and shares it with the Navbar and pages.
    // It lives here because only logged-in customers have a cart.
    <CartProvider>
      <Navbar user={user} wishlistCount={wishlistCount} />
      <Outlet context={{ user, refreshWishlistCount }} />
    </CartProvider>
  )
}

export default ProtectedLayout
