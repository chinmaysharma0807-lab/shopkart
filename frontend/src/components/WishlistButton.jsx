import { useEffect, useState } from 'react'
import { addToWishlist, removeFromWishlist } from '../services/api.js'

// Toggle button used on product cards and the details page.
// `saved` comes from the parent (which loaded it from GET /wishlist);
// `onChange(newSaved)` tells the parent when the backend confirms a change.
function WishlistButton({ productId, saved, onChange }) {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text }

  // Success messages disappear after a few seconds; errors stay until the next click
  useEffect(() => {
    if (message?.type !== 'success') return
    const timer = setTimeout(() => setMessage(null), 2500)
    return () => clearTimeout(timer)
  }, [message])

  const handleClick = async () => {
    if (saving) return // ignore extra clicks while a request is running

    setSaving(true)
    setMessage(null)

    try {
      if (saved) {
        await removeFromWishlist(productId)
        onChange(false)
        setMessage({ type: 'success', text: 'Removed from Wishlist' })
      } else {
        await addToWishlist(productId)
        onChange(true)
        setMessage({ type: 'success', text: '♥ Added to Wishlist' })
      }
    } catch (err) {
      const status = err.response?.status

      // The backend already has the state we wanted (e.g. changed in another tab)
      if (!saved && status === 409) onChange(true)
      else if (saved && status === 404) onChange(false)
      else if (status === 401) setMessage({ type: 'error', text: 'Please log in again.' })
      else
        setMessage({
          type: 'error',
          text: saved
            ? 'Unable to remove product. Please try again.'
            : 'Unable to save product. Please try again.',
        })
    } finally {
      setSaving(false)
    }
  }

  let label = saved ? '♥ Remove from Wishlist' : '♡ Add to Wishlist'
  if (saving) label = saved ? '⏳ Removing...' : '⏳ Saving...'

  return (
    <div className="wishlist-action">
      <button
        type="button"
        className={`btn btn-wishlist ${saved ? 'is-saved' : ''}`}
        onClick={handleClick}
        disabled={saving}
        aria-pressed={saved}
      >
        {label}
      </button>
      {message && <p className={`wishlist-message ${message.type}`}>{message.text}</p>}
    </div>
  )
}

export default WishlistButton
