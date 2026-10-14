import { Link } from 'react-router-dom'
import { StatusBadge } from './OrderStatus.jsx'
import { formatDate, shortOrderId } from '../utils/formatDate.js'
import { formatPrice } from '../utils/formatPrice.js'

// One order in the My Orders list. Everything shown comes from the order's
// own snapshot, so it doesn't change if the products change later.
function OrderCard({ order }) {
  return (
    <article className="card order-card">
      <div className="order-card-header">
        <div>
          <h3>Order {shortOrderId(order._id)}</h3>
          <p className="order-date">{formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <ul className="order-card-items">
        {order.items.map((item) => (
          <li key={item.product}>
            {item.name} × {item.quantity}
          </li>
        ))}
      </ul>

      <div className="order-card-footer">
        <p>
          Total: <strong>{formatPrice(order.totalAmount)}</strong>
        </p>
        <Link to={`/orders/${order._id}`} className="btn btn-outline">
          View Details
        </Link>
      </div>
    </article>
  )
}

export default OrderCard
