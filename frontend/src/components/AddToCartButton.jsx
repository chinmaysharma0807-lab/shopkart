import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { cartErrorMessage } from '../utils/cartErrorMessage.js'

// Used on product cards and the product details page.
// The "Adding..." state is local to this one button, so adding one product
// doesn't put every other button on the page into a loading state.
function AddToCartButton({ product }) {
  const { addToCart, getQuantity } = useCart()
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text }

  const inCart = getQuantity(product._id)
  const outOfStock = product.stock === 0
  const reachedStock = !outOfStock && inCart >= product.stock

  const handleClick = async () => {
    if (adding) return // ignore extra clicks while a request is running

    setAdding(true)
    setMessage(null)
    try {
      await addToCart(product._id)
      setMessage({ type: 'success', text: 'Added to cart' })
    } catch (err) {
      setMessage({
        type: 'error',
        text: cartErrorMessage(err, 'Unable to add to cart. Please try again.'),
      })
    } finally {
      setAdding(false)
    }
  }

  let label = inCart > 0 ? 'Add Another' : 'Add to Cart'
  if (outOfStock) label = 'Out of Stock'
  else if (reachedStock) label = 'Max in Cart'
  if (adding) label = 'Adding...'

  return (
    <div className="cart-action">
      <button
        type="button"
        className="btn btn-primary btn-cart"
        onClick={handleClick}
        disabled={adding || outOfStock || reachedStock}
      >
        {label}
      </button>
      {inCart > 0 && (
        <p className="cart-note">
          {inCart} in <Link to="/cart">cart</Link>
          {message?.type === 'success' && ' ✓'}
        </p>
      )}
      {message?.type === 'error' && <p className="wishlist-message error">{message.text}</p>}
    </div>
  )
}

export default AddToCartButton
