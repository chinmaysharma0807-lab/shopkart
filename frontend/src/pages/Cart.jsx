import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CartItem from '../components/CartItem.jsx'
import { useCart } from '../context/CartContext.jsx'
import { formatPrice } from '../utils/formatPrice.js'

function Cart() {
  // Same shared state the Navbar reads, so the two can never disagree
  const { cartItems, loading, error, totalUnits, subtotal, refreshCart } = useCart()
  const navigate = useNavigate()

  // Re-fetch when the page opens so prices and stock are the latest
  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  if (loading) {
    return <p className="status">Loading your cart...</p>
  }

  if (error) {
    return (
      <main className="products-page">
        <div className="state-box">
          <h2>Unable to load your cart.</h2>
          <p>Please check your connection and try again.</p>
          <button className="btn btn-primary btn-inline" onClick={refreshCart}>
            Try Again
          </button>
        </div>
      </main>
    )
  }

  if (cartItems.length === 0) {
    return (
      <main className="products-page">
        <div className="state-box">
          <div className="state-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet.</p>
          <Link to="/products" className="btn btn-primary btn-inline">
            Browse Products
          </Link>
        </div>
      </main>
    )
  }

  const hasStockProblem = cartItems.some((item) => item.quantity > item.product.stock)

  return (
    <main className="products-page">
      <div className="products-header">
        <h1>My Cart</h1>
        <Link to="/products" className="continue-link">
          Continue shopping →
        </Link>
      </div>

      <div className="cart-layout">
        <section className="cart-items">
          {cartItems.map((item) => (
            <CartItem key={item.product._id} item={item} />
          ))}
        </section>

        <aside className="card order-summary">
          <h2>Order Summary</h2>
          <dl>
            <div>
              <dt>Items</dt>
              <dd>{totalUnits}</dd>
            </div>
            <div className="summary-total">
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
          </dl>

          {hasStockProblem && (
            <p className="cart-warning">Fix the stock issues above before checking out.</p>
          )}

          <button
            className="btn btn-primary"
            disabled={hasStockProblem}
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </button>
        </aside>
      </div>
    </main>
  )
}

export default Cart
