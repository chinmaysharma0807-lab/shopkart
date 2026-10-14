const CATEGORIES = ['Electronics', 'Fashion', 'Books', 'Home']

// Controlled inputs only: the Products page owns the values and
// passes them in, and gets told about every change.
function SearchBar({ search, category, sort, onSearchChange, onCategoryChange, onSortChange }) {
  return (
    <div className="search-bar">
      <input
        type="search"
        placeholder="Search products..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search products"
      />

      <select value={category} onChange={(e) => onCategoryChange(e.target.value)} aria-label="Category">
        <option value="">All Categories</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <select value={sort} onChange={(e) => onSortChange(e.target.value)} aria-label="Sort by">
        <option value="">Newest first</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
      </select>
    </div>
  )
}

export default SearchBar
