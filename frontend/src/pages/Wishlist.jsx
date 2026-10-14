import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import WishlistCard from '../components/WishlistCard.jsx'
import { getWishlist } from '../services/api.js'

// Shows the logged-in customer's saved products. Everything comes from
// GET /wishlist, so the list survives refreshes and new logins.
function Wishlist() {
  const { refreshWishlistCount } = useOutletContext()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Also used by the "Try Again" button
  const loadWishlist = useCallback(() => {
    setLoading(true)
    setError(false)

    getWishlist()
      .then((res) => setProducts(res.data.wishlist))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadWishlist()
  }, [loadWishlist])

  // The backend has already removed it; update the list without refetching
  const handleRemoved = (productId) => {
    setProducts((prev) => prev.filter((product) => product._id !== productId))
    refreshWishlistCount()
  }

  const renderContent = () => {
    if (loading) {
      return <p className="status">Loading your wishlist...</p>
    }

    if (error) {
      return (
        <div className="state-box">
          <h2>Something went wrong.</h2>
          <p>We couldn't load your wishlist.</p>
          <button className="btn btn-primary btn-inline" onClick={loadWishlist}>
            Try Again
          </button>
        </div>
      )
    }

    if (products.length === 0) {
      return (
        <div className="state-box">
          <div className="state-icon">❤️</div>
          <h2>Your wishlist is empty</h2>
          <p>Save products you love and find them here later.</p>
          <Link to="/products" className="btn btn-primary btn-inline">
            Browse Products
          </Link>
        </div>
      )
    }

    return (
      <div className="product-grid">
        {products.map((product) => (
          <WishlistCard key={product._id} product={product} onRemoved={handleRemoved} />
        ))}
      </div>
    )
  }

  return (
    <main className="products-page">
      <div className="products-header">
        <div>
          <h1>My Wishlist</h1>
          {!loading && !error && (
            <span className="result-count">
              {products.length} {products.length === 1 ? 'product' : 'products'} saved
            </span>
          )}
        </div>
        {!loading && !error && products.length > 0 && (
          <Link to="/products" className="continue-link">
            Continue shopping →
          </Link>
        )}
      </div>

      {renderContent()}
    </main>
  )
}

export default Wishlist
