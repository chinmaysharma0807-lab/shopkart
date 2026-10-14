import { Link } from 'react-router-dom'
import AddToCartButton from './AddToCartButton.jsx'
import WishlistButton from './WishlistButton.jsx'
import { formatPrice } from '../utils/formatPrice.js'
import { stockLabel } from '../utils/stockLabel.js'

function ProductCard({ product, saved, onSavedChange }) {
  const stock = stockLabel(product.stock)

  return (
    <article className="product-card">
      <div className="product-image">
        {saved && (
          <span className="saved-badge" title="In your wishlist">
            ♥
          </span>
        )}
        <img src={product.image} alt={product.name} loading="lazy" />
      </div>

      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <p className="product-price">{formatPrice(product.price)}</p>
        <p className={`stock ${stock.className}`}>{stock.text}</p>

        <div className="card-actions">
          <AddToCartButton product={product} />
          <Link to={`/products/${product._id}`} className="btn btn-outline btn-block">
            View Details
          </Link>
          <WishlistButton
            productId={product._id}
            saved={saved}
            onChange={(newSaved) => onSavedChange(product._id, newSaved)}
          />
        </div>
      </div>
    </article>
  )
}

export default ProductCard
