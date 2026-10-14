import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { logoutCustomer } from '../services/api.js'

// Reads the shared cart state, so it updates the moment the cart changes.
// Shows total units (Keyboard x2 + Mouse x1 = 3), not the number of rows.
function CartLink() {
  const { totalUnits, loading, error } = useCart()
  return <NavLink to="/cart">Cart{!loading && !error && ` (${totalUnits})`}</NavLink>
}

// `user` and `wishlistCount` are passed in by ProtectedLayout. When `user`
// is missing we're on a public page, so show Login / Register instead.
function Navbar({ user, wishlistCount }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logoutCustomer() // backend clears the HttpOnly cookie
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <nav className="navbar">
      <Link to="/home" className="brand">
        Shop<span>Kart</span>
      </Link>

      <div className="nav-links">
        {user ? (
          <>
            <NavLink to="/home">Home</NavLink>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/wishlist">
              Wishlist{wishlistCount !== null && ` (${wishlistCount})`}
            </NavLink>
            <CartLink />
            <NavLink to="/orders">Orders</NavLink>
            <span className="nav-user">Hi, {user.fullName.split(' ')[0]}</span>
            <button className="btn btn-outline" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
