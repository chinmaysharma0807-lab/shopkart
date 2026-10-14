import { useState } from 'react'
import { Link } from 'react-router-dom'
import { removeFromWishlist } from '../services/api.js'
import { formatPrice } from '../utils/formatPrice.js'
import { stockLabel } from '../utils/stockLabel.js'

// One saved product on the Wishlist page.
// `onRemoved(productId)` tells the page to drop it from the list.
function WishlistCard({ product, onRemoved }) {
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState('')
  const stock = stockLabel(product.stock)

  const handleRemove = async () => {
    if (removing) return

    setRemoving(true)
    setError('')

    try {
      await removeFromWishlist(product._id)
      onRemoved(product._id)
    } catch (err) {
      // 404 = it was already removed (e.g. in another tab), so drop it anyway
      if (err.response?.status === 404) {
        onRemoved(product._id)
      } else {
        setError('Unable to remove product. Please try again.')
        setRemoving(false)
      }
    }
  }

  return (
    <article className="product-card">
      <div className="product-image">
        <img src={product.image} alt={product.name} loading="lazy" />
      </div>

      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <p className="product-price">{formatPrice(product.price)}</p>
        <p className={`stock ${stock.className}`}>{stock.text}</p>

        <div className="card-actions">
          <Link to={`/products/${product._id}`} className="btn btn-outline btn-block">
            View Details
          </Link>
          <button
            type="button"
            className="btn btn-wishlist is-saved"
            onClick={handleRemove}
            disabled={removing}
          >
            {removing ? '⏳ Removing...' : 'Remove ♥'}
          </button>
          {error && <p className="wishlist-message error">{error}</p>}
        </div>
      </div>
    </article>
  )
}

export default WishlistCard
