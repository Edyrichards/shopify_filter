/**
 * Boost AI Search & Filter - Customer-facing widget
 * Integrates with any Shopify theme
 */

class BoostSearchWidget {
  constructor() {
    this.widget = document.getElementById("boost-search-widget")
    this.searchInput = document.getElementById("boost-search-input")
    this.searchBtn = document.getElementById("boost-search-btn")
    this.filtersContainer = document.getElementById("boost-filters")
    this.resultsContainer = document.getElementById("boost-search-results")
    this.loadingContainer = document.getElementById("boost-loading")

    this.shopDomain = this.widget.dataset.shop
    this.apiKey = this.widget.dataset.apiKey
    this.apiBase = `https://${this.shopDomain}/apps/boost-search/api`

    this.currentFilters = {}
    this.searchTimeout = null

    this.init()
  }

  init() {
    this.bindEvents()
    this.loadInitialData()
  }

  bindEvents() {
    // Search input with debouncing
    this.searchInput.addEventListener("input", (e) => {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value)
      }, 300)
    })

    // Search button
    this.searchBtn.addEventListener("click", () => {
      this.performSearch(this.searchInput.value)
    })

    // Enter key support
    this.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.performSearch(this.searchInput.value)
      }
    })
  }

  async loadInitialData() {
    try {
      // Load available filters
      const response = await fetch(`${this.apiBase}/filters`)
      const data = await response.json()

      this.renderFilters(data.availableFilters)

      // Load initial products
      this.performSearch("")
    } catch (error) {
      console.error("Failed to load initial data:", error)
    }
  }

  renderFilters(filters) {
    // Render category filters
    const categoryContainer = document.getElementById("boost-category-filters")
    if (filters.categories && categoryContainer) {
      categoryContainer.innerHTML = filters.categories
        .map(
          (category) => `
        <label class="boost-filter-option">
          <input type="checkbox" value="${category}" onchange="boostWidget.updateFilter('category', this.value, this.checked)">
          <span>${category}</span>
        </label>
      `,
        )
        .join("")
    }

    // Render tag filters
    const tagContainer = document.getElementById("boost-tag-filters")
    if (filters.tags && tagContainer) {
      tagContainer.innerHTML = filters.tags
        .slice(0, 10)
        .map(
          (tag) => `
        <label class="boost-filter-option">
          <input type="checkbox" value="${tag}" onchange="boostWidget.updateFilter('tag', this.value, this.checked)">
          <span>${tag}</span>
        </label>
      `,
        )
        .join("")
    }

    // Setup price range
    this.setupPriceRange(filters.priceRange)
  }

  setupPriceRange(priceRange) {
    const minSlider = document.getElementById("boost-price-min")
    const maxSlider = document.getElementById("boost-price-max")
    const minDisplay = document.getElementById("boost-price-min-display")
    const maxDisplay = document.getElementById("boost-price-max-display")

    if (minSlider && maxSlider && priceRange) {
      minSlider.min = priceRange.min
      minSlider.max = priceRange.max
      maxSlider.min = priceRange.min
      maxSlider.max = priceRange.max

      minSlider.value = priceRange.min
      maxSlider.value = priceRange.max

      const updatePriceDisplay = () => {
        const min = Number.parseInt(minSlider.value)
        const max = Number.parseInt(maxSlider.value)

        minDisplay.textContent = `$${min}`
        maxDisplay.textContent = `$${max}`

        this.currentFilters.minPrice = min
        this.currentFilters.maxPrice = max

        this.performSearch(this.searchInput.value)
      }

      minSlider.addEventListener("input", updatePriceDisplay)
      maxSlider.addEventListener("input", updatePriceDisplay)
    }
  }

  updateFilter(type, value, checked) {
    if (type === "category") {
      this.currentFilters.category = checked ? value : null
    } else if (type === "tag") {
      if (!this.currentFilters.tags) this.currentFilters.tags = []

      if (checked) {
        this.currentFilters.tags.push(value)
      } else {
        this.currentFilters.tags = this.currentFilters.tags.filter((tag) => tag !== value)
      }

      if (this.currentFilters.tags.length === 0) {
        delete this.currentFilters.tags
      }
    }

    this.performSearch(this.searchInput.value)
  }

  async performSearch(query) {
    this.showLoading(true)

    try {
      const params = new URLSearchParams({
        search: query,
        ...this.currentFilters,
        limit: "20",
      })

      if (this.currentFilters.tags) {
        params.set("tags", this.currentFilters.tags.join(","))
      }

      const response = await fetch(`${this.apiBase}/products?${params.toString()}`)
      const data = await response.json()

      this.renderResults(data.products)

      // Show/hide filters based on search activity
      if (query || Object.keys(this.currentFilters).length > 0) {
        this.filtersContainer.style.display = "block"
      }
    } catch (error) {
      console.error("Search failed:", error)
      this.renderError("Search failed. Please try again.")
    } finally {
      this.showLoading(false)
    }
  }

  renderResults(products) {
    if (!products || products.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="boost-no-results">
          <p>No products found. Try adjusting your search or filters.</p>
        </div>
      `
      return
    }

    this.resultsContainer.innerHTML = products
      .map(
        (product) => `
      <div class="boost-product-card">
        <a href="/products/${product.handle || product.id}">
          <img 
            src="${product.image || "/assets/placeholder.svg"}" 
            alt="${product.name}"
            class="boost-product-image"
            loading="lazy"
          />
          <div class="boost-product-info">
            <h3 class="boost-product-title">${product.name}</h3>
            <div class="boost-product-price">
              ${
                product.compare_at_price && product.compare_at_price > product.price
                  ? `<span class="boost-price-compare">$${product.compare_at_price}</span>`
                  : ""
              }
              <span class="boost-price-current">$${product.price}</span>
            </div>
            ${
              product.rating
                ? `
              <div class="boost-product-rating">
                ${"★".repeat(Math.floor(product.rating))}${"☆".repeat(5 - Math.floor(product.rating))}
                <span>(${product.reviews || 0})</span>
              </div>
            `
                : ""
            }
          </div>
        </a>
      </div>
    `,
      )
      .join("")
  }

  renderError(message) {
    this.resultsContainer.innerHTML = `
      <div class="boost-error">
        <p>${message}</p>
      </div>
    `
  }

  showLoading(show) {
    this.loadingContainer.style.display = show ? "block" : "none"
    this.resultsContainer.style.display = show ? "none" : "grid"
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("boost-search-widget")) {
    window.boostWidget = new BoostSearchWidget()
  }
})

// Add CSS for filter options
const filterStyles = `
  .boost-filter-option {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
    cursor: pointer;
  }
  
  .boost-filter-option input {
    margin-right: 0.5rem;
  }
  
  .boost-filter-option span {
    font-size: 14px;
    color: #333;
  }
  
  .boost-no-results,
  .boost-error {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: #666;
  }
  
  .boost-price-compare {
    text-decoration: line-through;
    color: #999;
    margin-right: 0.5rem;
  }
  
  .boost-product-rating {
    font-size: 14px;
    color: #ffa500;
    margin-top: 0.5rem;
  }
`

const styleSheet = document.createElement("style")
styleSheet.textContent = filterStyles
document.head.appendChild(styleSheet)
