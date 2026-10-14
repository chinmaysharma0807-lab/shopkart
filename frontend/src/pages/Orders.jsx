import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import OrderCard from '../components/OrderCard.jsx'
import { getOrders } from '../services/api.js'

// Order history from GET /orders (newest first, only this customer's orders)
function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadOrders = useCallback(() => {
    setLoading(true)
    setError(false)
    getOrders()
      .then((res) => setOrders(res.data.orders))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const renderContent = () => {
    if (loading) return <p className="status">Loading your orders...</p>

    if (error) {
      return (
        <div className="state-box">
          <h2>Something went wrong.</h2>
          <p>We couldn't load your orders.</p>
          <button className="btn btn-primary btn-inline" onClick={loadOrders}>
            Try Again
          </button>
        </div>
      )
    }

    if (orders.length === 0) {
      return (
        <div className="state-box">
          <div className="state-icon">📦</div>
          <h2>You have not placed any orders yet.</h2>
          <p>Your orders will show up here after checkout.</p>
          <Link to="/products" className="btn btn-primary btn-inline">
            Start Shopping
          </Link>
        </div>
      )
    }

    return (
      <div className="order-list">
        {orders.map((order) => (
          <OrderCard key={order._id} order={order} />
        ))}
      </div>
    )
  }

  return (
    <main className="products-page orders-page">
      <div className="products-header">
        <div>
          <h1>My Orders</h1>
          {!loading && !error && orders.length > 0 && (
            <span className="result-count">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </span>
          )}
        </div>
      </div>
      {renderContent()}
    </main>
  )
}

export default Orders
