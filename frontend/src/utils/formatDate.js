// "2026-10-05T10:00:00.000Z" -> "5 Oct 2026"
export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

// Short, readable order number from a MongoDB id: "...ace845" -> "#D3810F8ACE845"
export const shortOrderId = (id) => `#${id.slice(-10).toUpperCase()}`
