const STEPS = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED']

const LABELS = {
  PENDING_PAYMENT: 'Awaiting payment',
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
}

// Small coloured label, e.g. on order cards
export function StatusBadge({ status }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{LABELS[status]}</span>
}

// Bonus: progress tracker  Placed ─ Confirmed ─ Shipped ─ Delivered
function OrderStatus({ status }) {
  const current = STEPS.indexOf(status)

  if (current === -1) return <StatusBadge status={status} />

  return (
    <ol className="status-tracker">
      {STEPS.map((step, index) => (
        <li key={step} className={index <= current ? 'done' : ''}>
          <span className="dot">{index <= current ? '✓' : index + 1}</span>
          <span className="step-label">{LABELS[step]}</span>
        </li>
      ))}
    </ol>
  )
}

export default OrderStatus
