// Turns an axios error into a message we can show next to a button
export const cartErrorMessage = (err, fallback) => {
  if (err.response?.status === 401) return 'Please log in again.'
  if (err.response?.status === 400) return err.response.data.message // e.g. "Only 3 in stock"
  return fallback
}
