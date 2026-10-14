import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import CheckoutForm from '../components/CheckoutForm.jsx'
import OrderSummary from '../components/OrderSummary.jsx'
import { useCart } from '../context/CartContext.jsx'
import { createPaymentOrder, verifyPayment } from '../services/api.js'
import { formatPrice } from '../utils/formatPrice.js'
import { loadRazorpayScript } from '../utils/loadRazorpay.js'
import { validateShipping } from '../utils/validateShipping.js'

const FORM_ID = 'checkout-form'

// step: 'idle' -> 'creating' (our API) -> 'paying' (Razorpay popup open)
//       -> 'verifying' (our API checks the signature) -> success page
const BUTTON_LABELS = {
  creating: 'Creating order...',
  paying: 'Waiting for payment...',
  verifying: 'Verifying payment...',
}

function Checkout() {
  const { user } = useOutletContext()
  const { cartItems, loading, error, subtotal, refreshCart, clearCart } = useCart()
  const navigate = useNavigate()

  // Form state lives here because the Place Order button (in the summary)
  // and the form both need it
  const [form, setForm] = useState({
    fullName: user.fullName,
    phone: user.phone,
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState('idle')
  const [message, setMessage] = useState(null) // { type: 'error' | 'info', text }
  // Set after a verified payment so we don't flash "cart is empty" while leaving
  const [orderPlaced, setOrderPlaced] = useState(false)

  // Get the latest prices and stock before the customer reviews the order
  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  // Runs after Razorpay reports a successful payment. We don't trust that
  // report: the server checks the signature before the order counts as paid.
  const confirmPayment = async (shopKartOrderId, response) => {
    setStep('verifying')
    try {
      const res = await verifyPayment({
        shopKartOrderId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      })
      setOrderPlaced(true)
      navigate(`/order-success/${res.data.order._id}`, { replace: true })
      clearCart() // the server has emptied the cart; Navbar now shows Cart (0)
    } catch (err) {
      setStep('idle')
      const serverMessage = err.response?.data?.message || 'We could not confirm your payment'
      const reason = serverMessage.replace(/\.$/, '') // drop a trailing full stop
      setMessage({
        type: 'error',
        text: `${reason}. Your cart has not been cleared. Payment ID: ${response.razorpay_payment_id}`,
      })
    }
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (step !== 'idle') return // already in progress

    // 1. Check the form here first; don't call the API with bad data
    const { address, errors: formErrors } = validateShipping(form)
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      setMessage({ type: 'error', text: 'Please fix the highlighted fields.' })
      return
    }

    setMessage(null)
    setStep('creating')

    // 2. Razorpay's Checkout script
    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      setStep('idle')
      setMessage({
        type: 'error',
        text: 'Could not load the payment gateway. Check your internet connection and try again.',
      })
      return
    }

    // 3. Ask our server to validate the cart and create the orders.
    //    Only the address is sent; the server calculates the amount.
    let data
    try {
      const res = await createPaymentOrder(address)
      data = res.data
    } catch (err) {
      const body = err.response?.data
      if (body?.errors) setErrors(body.errors)
      setMessage({
        type: 'error',
        text: body?.message || 'Could not start checkout. Please try again.',
      })
      setStep('idle')
      refreshCart() // e.g. stock changed: show the cart as it is now
      return
    }

    // 4. Open Razorpay Checkout with the order the server created
    setStep('paying')
    const razorpay = new window.Razorpay({
      key: data.key, // public key ID only; the secret never leaves the server
      amount: data.amount, // in paise, decided by the server
      currency: data.currency,
      order_id: data.razorpayOrderId,
      name: 'ShopKart',
      description: 'ShopKart Order',
      // Razorpay expects the phone with its country code: +919876543210
      prefill: { name: address.fullName, contact: `+91${address.phone}`, email: user.email },
      theme: { color: '#2563eb' },
      handler: (response) => confirmPayment(data.shopKartOrderId, response),
      modal: {
        // Customer closed the popup without paying
        ondismiss: () => {
          setStep((current) => (current === 'paying' ? 'idle' : current))
          setMessage(
            (current) =>
              current ?? {
                type: 'info',
                text: 'Payment cancelled. Your cart has not been cleared.',
              },
          )
        },
      },
    })

    razorpay.on('payment.failed', (response) => {
      setMessage({
        type: 'error',
        text: `Payment failed: ${response.error?.description || 'unknown error'}. Your cart has not been cleared. Please try again.`,
      })
    })

    razorpay.open()
  }

  if (loading) return <p className="status">Loading checkout...</p>

  if (error) {
    return (
      <main className="products-page">
        <div className="state-box">
          <h2>Unable to load your cart.</h2>
          <p>We need your cart to check out.</p>
          <button className="btn btn-primary btn-inline" onClick={refreshCart}>
            Try Again
          </button>
        </div>
      </main>
    )
  }

  // Someone opened /checkout directly with nothing in the cart
  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <main className="products-page">
        <div className="state-box">
          <div className="state-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add something to your cart before checking out.</p>
          <Link to="/products" className="btn btn-primary btn-inline">
            Browse Products
          </Link>
        </div>
      </main>
    )
  }

  const stockProblems = cartItems.filter((item) => item.quantity > item.product.stock)
  const busy = step !== 'idle'

  return (
    <main className="products-page">
      <div className="products-header">
        <h1>Checkout</h1>
        <Link to="/cart" className="continue-link">
          ← Back to cart
        </Link>
      </div>

      {message && (
        <div
          className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-info'} checkout-alert`}
        >
          {message.text}
        </div>
      )}

      <div className="cart-layout">
        <CheckoutForm
          id={FORM_ID}
          values={form}
          errors={errors}
          disabled={busy}
          onChange={handleChange}
          onSubmit={handlePlaceOrder}
        />

        <OrderSummary
          items={cartItems}
          total={subtotal}
          formId={FORM_ID}
          disabled={busy || stockProblems.length > 0}
          buttonLabel={BUTTON_LABELS[step] || `Place Order · Pay ${formatPrice(subtotal)}`}
        >
          {stockProblems.length > 0 && (
            <p className="cart-warning">
              Not enough stock for {stockProblems.map((item) => item.product.name).join(', ')}.{' '}
              <Link to="/cart">Update your cart</Link>
            </p>
          )}
        </OrderSummary>
      </div>
    </main>
  )
}

export default Checkout
