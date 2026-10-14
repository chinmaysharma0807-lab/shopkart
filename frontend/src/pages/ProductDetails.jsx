import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import AddToCartButton from '../components/AddToCartButton.jsx'
import WishlistButton from '../components/WishlistButton.jsx'
import { getProductById, getWishlist } from '../services/api.js'
import { formatPrice } from '../utils/formatPrice.js'
import { stockLabel } from '../utils/stockLabel.js'

function ProductDetails() {
  const { id } = useParams() // the :id part of /products/:id
  const navigate = useNavigate()
  const location = useLocation()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const { refreshWishlistCount } = useOutletContext()

  useEffect(() => {
    setLoading(true)
    setError('')

    getProductById(id)
      .then((res) => setProduct(res.data.product))
      .catch((err) => {
        const status = err.response?.status
        if (status === 404 || status === 400) setError('Product not found.')
        else setError('Something went wrong while loading this product.')
      })
      .finally(() => setLoading(false))
  }, [id])

  // Is this product already in the wishlist?
  useEffect(() => {
    getWishlist()
      .then((res) => setSaved(res.data.wishlist.some((p) => p._id === id)))
      .catch(() => {})
  }, [id])

  // Go back to the list with the same filters if we came from it,
  // otherwise (e.g. opened from a shared link) go to /products.
  const goBack = () => {
    if (location.key !== 'default') navigate(-1)
    else navigate('/products')
  }

  if (loading) return <p className="status">Loading product...</p>

  if (error) {
    return (
      <main className="details-page">
        <p className="status status-error">{error}</p>
        <p className="status">
          <Link to="/products">Back to products</Link>
        </p>
      </main>
    )
  }

  const stock = stockLabel(product.stock)

  return (
    <main className="details-page">
      <button className="back-link" onClick={goBack}>
        ← Back to products
      </button>

      <div className="details card">
        <div className="details-image">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="details-info">
          <span className="product-category">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="details-price">{formatPrice(product.price)}</p>
          <p className={`stock ${stock.className}`}>{stock.text}</p>
          <p className="details-description">{product.description}</p>

          <div className="details-actions">
            <AddToCartButton product={product} />
            <WishlistButton
              productId={product._id}
              saved={saved}
              onChange={(newSaved) => {
                setSaved(newSaved)
                refreshWishlistCount()
              }}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

export default ProductDetails
