import { useCallback, useEffect, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import SearchBar from '../components/SearchBar.jsx'
import { getProducts, getWishlist } from '../services/api.js'

// The filters live in the page URL (/products?search=phone&category=Electronics)
// so a refresh, a shared link, or the Back button keeps them.
function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || ''

  // What's typed in the box right now. It's copied into the URL after the
  // user stops typing for 400ms, so we don't call the API on every key press.
  const [searchText, setSearchText] = useState(search)

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // IDs of products in this customer's wishlist, loaded from the backend
  const [savedIds, setSavedIds] = useState(new Set())
  const { refreshWishlistCount } = useOutletContext()

  // Set or remove one query param, keeping the others
  const updateParam = useCallback(
    (key, value) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value) next.set(key, value)
          else next.delete(key)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  // Debounce: wait until typing pauses before updating the URL
  useEffect(() => {
    const timer = setTimeout(() => updateParam('search', searchText.trim()), 400)
    return () => clearTimeout(timer)
  }, [searchText, updateParam])

  // Fetch from the backend whenever a filter changes
  useEffect(() => {
    let ignore = false // drops responses from older requests that finish late

    setLoading(true)
    setError('')

    getProducts({ search, category, sort })
      .then((res) => {
        if (!ignore) setProducts(res.data.products)
      })
      .catch(() => {
        if (!ignore) setError('Something went wrong while loading products.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [search, category, sort])

  // Load the wishlist once so each card knows whether it's already saved
  useEffect(() => {
    getWishlist()
      .then((res) => setSavedIds(new Set(res.data.wishlist.map((p) => p._id))))
      .catch(() => {}) // cards still work; the backend answers 409 for duplicates
  }, [])

  // Called by a card after the backend confirms an add or remove
  const handleSavedChange = (productId, saved) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (saved) next.add(productId)
      else next.delete(productId)
      return next
    })
    refreshWishlistCount()
  }

  const renderContent = () => {
    if (loading) return <p className="status">Loading products...</p>
    if (error) return <p className="status status-error">{error}</p>
    if (products.length === 0) return <p className="status">No products found.</p>

    return (
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            saved={savedIds.has(product._id)}
            onSavedChange={handleSavedChange}
          />
        ))}
      </div>
    )
  }

  return (
    <main className="products-page">
      <div className="products-header">
        <h1>Products</h1>
        {!loading && !error && (
          <span className="result-count">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </span>
        )}
      </div>

      <SearchBar
        search={searchText}
        category={category}
        sort={sort}
        onSearchChange={setSearchText}
        onCategoryChange={(value) => updateParam('category', value)}
        onSortChange={(value) => updateParam('sort', value)}
      />

      {renderContent()}
    </main>
  )
}

export default Products
