import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import OrderStatus from '../components/OrderStatus.jsx'
import { getOrderById } from '../services/api.js'
import { formatDate, shortOrderId } from '../utils/formatDate.js'
import { formatPrice } from '../utils/formatPrice.js'

// Used for both /orders/:id and /order-success/:id.
// `justPlaced` shows the success banner after checkout.
function OrderDetails({ justPlaced = false }) {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    getOrderById(id)
      .then((res) => setOrder(res.data.order))
      .catch((err) => {
        const status = err.response?.status
        // 404 also covers "this order belongs to someone else"
        setError(
          status === 404 || status === 400 ? 'Order not found.' : "We couldn't load this order.",
        )
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="status">Loading order...</p>

  if (error) {
    return (
      <main className="products-page">
        <div className="state-box">
          <h2>{error}</h2>
          <Link to="/orders" className="btn btn-primary btn-inline">
            View My Orders
          </Link>
        </div>
      </main>
    )
  }

  const paid = order.paymentStatus === 'PAID'
  const { shippingAddress: addr } = order

  return (
    <main className="products-page order-details">
      {justPlaced && paid && (
        <section className="card success-banner">
          <div className="success-icon">✅</div>
          <h1>Order Placed Successfully</h1>
          <p>Your payment was verified and your order has been saved.</p>
          <dl className="success-facts">
            <div>
              <dt>Order ID</dt>
              <dd>{order._id}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{formatPrice(order.totalAmount)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{order.status}</dd>
            </div>
          </dl>
          <div className="success-actions">
            <Link to="/orders" className="btn btn-primary btn-inline">
              View My Orders
            </Link>
            <Link to="/products" className="btn btn-outline">
              Continue Shopping
            </Link>
          </div>
        </section>
      )}

      {!justPlaced && (
        <div className="products-header">
          <div>
            <h1>Order {shortOrderId(order._id)}</h1>
            <span className="result-count">Placed on {formatDate(order.createdAt)}</span>
          </div>
          <Link to="/orders" className="continue-link">
            ← All orders
          </Link>
        </div>
      )}

      {!paid && (
        <div className="alert alert-error checkout-alert">
          This order has not been paid, so it was not placed.
        </div>
      )}

      <section className="card order-section">
        <h2>Status</h2>
        <OrderStatus status={order.status} />
      </section>

      <section className="card order-section">
        <h2>Items</h2>
        {/* Name and price are the snapshot saved when the order was placed */}
        <ul className="order-items">
          {order.items.map((item) => (
            <li key={item.product}>
              {item.image && <img src={item.image} alt="" />}
              <div>
                <Link to={`/products/${item.product}`} className="cart-item-name">
                  {item.name}
                </Link>
                <p className="cart-item-price">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              </div>
              <strong>{formatPrice(item.price * item.quantity)}</strong>
            </li>
          ))}
        </ul>
        <p className="order-total">
          <span>Total paid</span>
          <strong>{formatPrice(order.totalAmount)}</strong>
        </p>
      </section>

      <div className="order-info-grid">
        <section className="card order-section">
          <h2>Shipping to</h2>
          <address>
            <strong>{addr.fullName}</strong>
            <br />
            {addr.addressLine1}
            <br />
            {addr.city}, {addr.state} {addr.pincode}
            <br />
            Phone: {addr.phone}
          </address>
        </section>

        <section className="card order-section">
          <h2>Payment</h2>
          <dl className="payment-facts">
            <div>
              <dt>Status</dt>
              <dd>{order.paymentStatus}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>Razorpay (Test Mode)</dd>
            </div>
            {order.razorpayPaymentId && (
              <div>
                <dt>Payment ID</dt>
                <dd>{order.razorpayPaymentId}</dd>
              </div>
            )}
            {order.paidAt && (
              <div>
                <dt>Paid on</dt>
                <dd>{formatDate(order.paidAt)}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>
    </main>
  )
}

export default OrderDetails
