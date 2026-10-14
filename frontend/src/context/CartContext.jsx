import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../services/api.js'

// The single frontend copy of the cart. The Navbar, product cards, product
// details page and Cart page all read from here instead of fetching their own.
const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]) // [{ product, quantity }]
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const hasLoaded = useRef(false)

  // Fetch the cart from the backend. Only the very first load shows the
  // loading state; later refreshes update quietly in the background.
  const refreshCart = useCallback(async () => {
    if (!hasLoaded.current) setLoading(true)
    setError(false)
    try {
      const res = await api.getCart()
      setCartItems(res.data.cart)
      hasLoaded.current = true
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  // Every mutation: call the API, then replace our state with the cart the
  // server sends back. If the call fails the error is re-thrown so the
  // button that started it can show a message; our state stays unchanged.
  const runMutation = useCallback(async (request) => {
    const res = await request()
    setCartItems(res.data.cart)
    hasLoaded.current = true
    setError(false)
    return res.data
  }, [])

  const addToCart = useCallback(
    (productId) => runMutation(() => api.addToCart(productId)),
    [runMutation],
  )

  const updateQuantity = useCallback(
    (productId, quantity) => runMutation(() => api.updateCartQuantity(productId, quantity)),
    [runMutation],
  )

  const removeFromCart = useCallback(
    (productId) => runMutation(() => api.removeFromCart(productId)),
    [runMutation],
  )

  // Called after the backend has verified a payment and emptied the cart in
  // MongoDB, so the Navbar shows Cart (0) straight away without a refetch.
  const clearCart = useCallback(() => {
    setCartItems([])
  }, [])

  // Derived values: calculated from cartItems, never stored separately
  const totalUnits = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const value = useMemo(
    () => ({
      cartItems,
      loading,
      error,
      totalUnits,
      subtotal,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      // How many of this product are in the cart (0 if none)
      getQuantity: (productId) =>
        cartItems.find((item) => item.product._id === productId)?.quantity ?? 0,
    }),
    [
      cartItems,
      loading,
      error,
      totalUnits,
      subtotal,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside <CartProvider>')
  return context
}
