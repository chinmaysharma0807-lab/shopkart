// Loads Razorpay's Checkout script once. Resolves true when window.Razorpay
// is ready, false if the script couldn't be downloaded (offline, blocked...).
let loadingPromise = null

export const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true)

  if (!loadingPromise) {
    loadingPromise = new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(Boolean(window.Razorpay))
      script.onerror = () => {
        loadingPromise = null // let the next click try again
        script.remove()
        resolve(false)
      }
      document.body.appendChild(script)
    })
  }

  return loadingPromise
}
