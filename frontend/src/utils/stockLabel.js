// Turns a stock number into the text + CSS class shown on cards and details
export const stockLabel = (stock) => {
  if (stock === 0) return { text: 'Out of stock', className: 'stock-out' }
  if (stock <= 5) return { text: `Only ${stock} left`, className: 'stock-low' }
  return { text: `${stock} units left`, className: 'stock-ok' }
}
