import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { cartErrorMessage } from '../utils/cartErrorMessage.js'
import { formatPrice } from '../utils/formatPrice.js'

// One row on the Cart page. Its busy/error state is local, so changing one
// item's quantity doesn't disable the controls of every other item.
function CartItem({ item }) {
  const { product, quantity } = item
  const { updateQuantity, removeFromCart } = useCart()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Runs one cart action; the shared cart state updates when it succeeds
  const run = async (action, fallbackMessage) => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (err) {
      setError(cartErrorMessage(err, fallbackMessage))
    } finally {
      setBusy(false)
    }
  }

  const decrease = () =>
    run(() => updateQuantity(product._id, quantity - 1), 'Unable to update quantity.')
  const increase = () =>
    run(() => updateQuantity(product._id, quantity + 1), 'Unable to update quantity.')
  const remove = () => run(() => removeFromCart(product._id), 'Unable to remove item.')

  // Stock can drop after the item was added; the backend will reject a
  // checkout-sized quantity, so tell the customer now.
  const overStock = quantity > product.stock

  return (
    <article className={`cart-item ${busy ? 'is-busy' : ''}`}>
      <Link to={`/products/${product._id}`} className="cart-item-image">
        <img src={product.image} alt={product.name} />
      </Link>

      <div className="cart-item-info">
        <Link to={`/products/${product._id}`} className="cart-item-name">
          {product.name}
        </Link>
        <p className="cart-item-price">{formatPrice(product.price)} each</p>

        {overStock && (
          <p className="cart-warning">
            {product.stock === 0
              ? 'This product is now out of stock. Please remove it.'
              : `Only ${product.stock} left in stock. Please reduce the quantity.`}
          </p>
        )}

        <div className="cart-item-controls">
          <div className="qty-control" aria-label={`Quantity of ${product.name}`}>
            <button
              type="button"
              onClick={decrease}
              disabled={busy || quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span>{quantity}</span>
            <button
              type="button"
              onClick={increase}
              disabled={busy || quantity >= product.stock}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button type="button" className="remove-link" onClick={remove} disabled={busy}>
            {busy ? 'Updating...' : 'Remove'}
          </button>
        </div>

        {error && <p className="wishlist-message error">{error}</p>}
      </div>

      <p className="cart-item-total">{formatPrice(product.price * quantity)}</p>
    </article>
  )
}

export default CartItem
