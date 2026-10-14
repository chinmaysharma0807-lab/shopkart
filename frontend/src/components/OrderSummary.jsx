import { formatPrice } from '../utils/formatPrice.js'

// Final review of the cart on the Checkout page. The total shown here is for
// the customer only; the amount actually charged is calculated by the server.
function OrderSummary({ items, total, formId, buttonLabel, disabled, children }) {
  return (
    <aside className="card order-summary">
      <h2>Order Summary</h2>

      <ul className="summary-items">
        {items.map(({ product, quantity }) => (
          <li key={product._id}>
            <span>
              {product.name} × {quantity}
            </span>
            <span>{formatPrice(product.price * quantity)}</span>
          </li>
        ))}
      </ul>

      <dl>
        <div className="summary-total">
          <dt>Total</dt>
          <dd>{formatPrice(total)}</dd>
        </div>
      </dl>

      {children}

      {/* form={formId} lets this button submit the shipping form even though it sits outside it */}
      <button type="submit" form={formId} className="btn btn-primary" disabled={disabled}>
        {buttonLabel}
      </button>

      <p className="test-mode-note">Razorpay Test Mode: no real money is charged.</p>
    </aside>
  )
}

export default OrderSummary
