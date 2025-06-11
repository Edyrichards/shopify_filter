/**
 * Boost AI Search & Filter - Advanced Customer Widget
 * Supports AI recommendations, voice search, visual search, and theme adaptation
 */

class BoostSearchWidget {
  constructor() {
    this.container = document.querySelector(".boost-search-container")
    if (!this.container) return

    this.searchInput = document.getElementById("boost-search-input")
    this.searchBtn = document.getElementById("boost-search-btn")
    this.voiceBtn = document.getElementById("boost-voice-search")
    this.visualBtn = document.getElementById("boost-visual-search")
    this.suggestionsContainer = document.getElementById("boost-suggestions")
    this.filtersContainer = document.getElementById("boost-quick-filters")
    this.resultsContainer = document.getElementById("boost-search-results")
    this.loadingContainer = document.getElementById("boost-loading")
    this.recommendationsContainer = document.getElementById("boost-recommendations")
    this.paginationContainer = document.getElementById("boost-pagination")

    // Configuration from data attributes
    this.config = {
      shop: this.container.dataset.shop,
      layout: this.container.dataset.layout || "standard",
      resultsLayout: this.container.dataset.resultsLayout || "grid",
      resultsPerPage: Number.parseInt(this.container.dataset.resultsPerPage) || 20,
      accentColor: this.container.dataset.accentColor || "#007ace",
    }

    // API endpoints
    this.apiBase = `/apps/boost-search/api`

    // State management
    this.state = {
      currentQuery: "",
      currentFilters: {},
      currentPage: 1,
      totalPages: 1,
      isLoading: false,
      suggestions: [],
      selectedSuggestion: -1,
      voiceRecognition: null,
      isRecording: false,
    }

    // Debounce timers
    this.searchTimeout = null
    this.suggestionsTimeout = null

    // Initialize
    this.init()
  }

  async init() {
    this.bindEvents()
    this.initializeVoiceSearch()
    this.initializeVisualSearch()
    this.loadInitialData()
    this.setupKeyboardNavigation()
    this.adaptToTheme()
  }

  bindEvents() {
    // Search input events
    this.searchInput.addEventListener("input", (e) => this.handleSearchInput(e))
    this.searchInput.addEventListener("focus", () => this.showSuggestions())
    this.searchInput.addEventListener("blur", () => {
      // Delay hiding suggestions to allow clicks
      setTimeout(() => this.hideSuggestions(), 150)
    })

    // Search button
    this.searchBtn.addEventListener("click", () => this.performSearch())

    // Voice search
    if (this.voiceBtn) {
      this.voiceBtn.addEventListener("click", () => this.toggleVoiceSearch())
    }

    // Visual search
    if (this.visualBtn) {
      this.visualBtn.addEventListener("click", () => this.openVisualSearch())
    }

    // Filter tabs
    document.querySelectorAll(".boost-filter-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => this.switchFilterTab(e.target.dataset.filter))
    })

    // Window events
    window.addEventListener("resize", () => this.adaptToTheme())
    document.addEventListener("click", (e) => this.handleOutsideClick(e))
  }

  setupKeyboardNavigation() {
    this.searchInput.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          this.navigateSuggestions(1)
          break
        case "ArrowUp":
          e.preventDefault()
          this.navigateSuggestions(-1)
          break
        case "Enter":
          e.preventDefault()
          if (this.state.selectedSuggestion >= 0) {
            this.selectSuggestion(this.state.selectedSuggestion)
          } else {
            this.performSearch()
          }
          break
        case "Escape":
          this.hideSuggestions()
          this.searchInput.blur()
          break
      }
    })
  }

  adaptToTheme() {
    // Detect theme colors and adapt
    const computedStyle = getComputedStyle(document.body)
    const bgColor = computedStyle.backgroundColor
    const textColor = computedStyle.color

    // Apply theme-aware styling
    this.container.style.setProperty("--boost-bg-color", bgColor)
    this.container.style.setProperty("--boost-text-color", textColor)

    // Detect dark theme
    const isDark = this.isColorDark(bgColor)
    if (isDark) {
      this.container.classList.add("boost-dark-theme")
    } else {
      this.container.classList.remove("boost-dark-theme")
    }
  }

  isColorDark(color) {
    // Convert color to RGB and calculate luminance
    const rgb = color.match(/\d+/g)
    if (!rgb) return false

    const [r, g, b] = rgb.map(Number)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance < 0.5
  }

  handleSearchInput(e) {
    const query = e.target.value.trim()
    this.state.currentQuery = query

    // Clear existing timeouts
    clearTimeout(this.searchTimeout)
    clearTimeout(this.suggestionsTimeout)

    // Show suggestions immediately for non-empty queries
    if (query.length > 0) {
      this.suggestionsTimeout = setTimeout(() => {
        this.loadSuggestions(query)
      }, 150)
    } else {
      this.hideSuggestions()
    }

    // Perform search with debouncing
    this.searchTimeout = setTimeout(() => {
      if (query.length > 2 || query.length === 0) {
        this.performSearch(query)
      }
    }, 300)
  }

  async loadSuggestions(query) {
    if (!query || query.length < 2) return

    try {
      const response = await fetch(`${this.apiBase}/suggestions?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      this.state.suggestions = data.suggestions || []
      this.renderSuggestions()
    } catch (error) {
      console.error("Failed to load suggestions:", error)
    }
  }

  renderSuggestions() {
    if (!this.state.suggestions.length) {
      this.hideSuggestions()
      return
    }

    const html = this.state.suggestions
      .map(
        (suggestion, index) => `
      <div class="boost-suggestion-item ${index === this.state.selectedSuggestion ? "highlighted" : ""}" 
           data-index="${index}" 
           onclick="boostWidget.selectSuggestion(${index})">
        <svg class="boost-suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          ${
            suggestion.type === "product"
              ? '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21,15 16,10 5,21"></polyline>'
              : '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path>'
          }
        </svg>
        <span class="boost-suggestion-text">${suggestion.text}</span>
        ${suggestion.count ? `<span class="boost-suggestion-count">${suggestion.count} results</span>` : ""}
      </div>
    `,
      )
      .join("")

    this.suggestionsContainer.innerHTML = html
    this.showSuggestions()
  }

  navigateSuggestions(direction) {
    const maxIndex = this.state.suggestions.length - 1
    this.state.selectedSuggestion += direction

    if (this.state.selectedSuggestion < -1) {
      this.state.selectedSuggestion = maxIndex
    } else if (this.state.selectedSuggestion > maxIndex) {
      this.state.selectedSuggestion = -1
    }

    this.renderSuggestions()
  }

  selectSuggestion(index) {
    const suggestion = this.state.suggestions[index]
    if (!suggestion) return

    this.searchInput.value = suggestion.text
    this.state.currentQuery = suggestion.text
    this.hideSuggestions()
    this.performSearch(suggestion.text)
  }

  showSuggestions() {
    if (this.state.suggestions.length > 0) {
      this.suggestionsContainer.style.display = "block"
    }
  }

  hideSuggestions() {
    this.suggestionsContainer.style.display = "none"
    this.state.selectedSuggestion = -1
  }

  handleOutsideClick(e) {
    if (!this.container.contains(e.target)) {
      this.hideSuggestions()
    }
  }

  // Voice Search Implementation
  initializeVoiceSearch() {
    if (!this.voiceBtn) return

    // Check for browser support
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      this.voiceBtn.style.display = "none"
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    this.state.voiceRecognition = new SpeechRecognition()

    this.state.voiceRecognition.continuous = false
    this.state.voiceRecognition.interimResults = false
    this.state.voiceRecognition.lang = "en-US"

    this.state.voiceRecognition.onstart = () => {
      this.state.isRecording = true
      this.voiceBtn.classList.add("recording")
      this.voiceBtn.title = "Listening... Click to stop"
    }

    this.state.voiceRecognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      this.searchInput.value = transcript
      this.state.currentQuery = transcript
      this.performSearch(transcript)
    }

    this.state.voiceRecognition.onend = () => {
      this.state.isRecording = false
      this.voiceBtn.classList.remove("recording")
      this.voiceBtn.title = "Voice Search"
    }

    this.state.voiceRecognition.onerror = (event) => {
      console.error("Voice recognition error:", event.error)
      this.state.isRecording = false
      this.voiceBtn.classList.remove("recording")
    }
  }

  toggleVoiceSearch() {
    if (!this.state.voiceRecognition) return

    if (this.state.isRecording) {
      this.state.voiceRecognition.stop()
    } else {
      this.state.voiceRecognition.start()
    }
  }

  // Visual Search Implementation
  initializeVisualSearch() {
    if (!this.visualBtn) return

    // Setup modal events
    const modal = document.getElementById("boost-visual-modal")
    const closeBtn = document.getElementById("boost-close-visual")
    const captureBtn = document.getElementById("boost-capture-btn")
    const uploadBtn = document.getElementById("boost-upload-btn")
    const fileInput = document.getElementById("boost-image-upload")

    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeVisualSearch())
    }

    if (captureBtn) {
      captureBtn.addEventListener("click", () => this.captureImage())
    }

    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => fileInput?.click())
    }

    if (fileInput) {
      fileInput.addEventListener("change", (e) => this.handleImageUpload(e))
    }

    // Close modal on outside click
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeVisualSearch()
        }
      })
    }
  }

  async openVisualSearch() {
    const modal = document.getElementById("boost-visual-modal")
    if (!modal) return

    modal.style.display = "flex"

    // Start camera
    try {
      const video = document.getElementById("boost-camera")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      video.srcObject = stream
      this.currentStream = stream
    } catch (error) {
      console.error("Camera access denied:", error)
      // Show upload option only
      document.querySelector(".boost-camera-container video").style.display = "none"
      document.getElementById("boost-capture-btn").style.display = "none"
    }
  }

  closeVisualSearch() {
    const modal = document.getElementById("boost-visual-modal")
    if (modal) {
      modal.style.display = "none"
    }

    // Stop camera stream
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop())
      this.currentStream = null
    }
  }

  captureImage() {
    const video = document.getElementById("boost-camera")
    const canvas = document.getElementById("boost-camera-canvas")
    const ctx = canvas.getContext("2d")

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        this.processVisualSearch(blob)
      },
      "image/jpeg",
      0.8,
    )
  }

  handleImageUpload(event) {
    const file = event.target.files[0]
    if (file && file.type.startsWith("image/")) {
      this.processVisualSearch(file)
    }
  }

  async processVisualSearch(imageBlob) {
    try {
      this.showLoading(true)

      const formData = new FormData()
      formData.append("image", imageBlob)

      const response = await fetch(`${this.apiBase}/visual-search`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.products) {
        this.renderResults(data.products, data.pagination)
        this.closeVisualSearch()
      }
    } catch (error) {
      console.error("Visual search failed:", error)
    } finally {
      this.showLoading(false)
    }
  }

  // Main search functionality
  async performSearch(query = this.state.currentQuery, page = 1) {
    this.state.isLoading = true
    this.state.currentPage = page
    this.showLoading(true)

    try {
      const params = new URLSearchParams({
        q: query || "",
        page: page.toString(),
        limit: this.config.resultsPerPage.toString(),
        layout: this.config.resultsLayout,
        ...this.state.currentFilters,
      })

      const response = await fetch(`${this.apiBase}/search?${params.toString()}`)
      const data = await response.json()

      this.renderResults(data.products, data.pagination)
      this.updateFilters(data.availableFilters)

      // Load AI recommendations if no query
      if (!query && data.recommendations) {
        this.renderRecommendations(data.recommendations)
      }

      // Show filters if there's a query or active filters
      if (query || Object.keys(this.state.currentFilters).length > 0) {
        this.showFilters()
      }

      // Record analytics
      this.recordSearchAnalytics(query, data.products.length)
    } catch (error) {
      console.error("Search failed:", error)
      this.renderError("Search failed. Please try again.")
    } finally {
      this.state.isLoading = false
      this.showLoading(false)
    }
  }

  renderResults(products, pagination) {
    if (!products || products.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="boost-no-results">
          <h3>No products found</h3>
          <p>Try adjusting your search terms or filters.</p>
          <button class="boost-btn boost-btn-secondary" onclick="boostWidget.clearSearch()">
            Clear Search
          </button>
        </div>
      `
      this.paginationContainer.style.display = "none"
      return
    }

    const html = products.map((product) => this.renderProductCard(product)).join("")
    this.resultsContainer.innerHTML = html

    // Update pagination
    if (pagination && pagination.totalPages > 1) {
      this.renderPagination(pagination)
      this.paginationContainer.style.display = "flex"
    } else {
      this.paginationContainer.style.display = "none"
    }

    // Lazy load images
    this.setupLazyLoading()
  }

  renderProductCard(product) {
    const isListLayout = this.config.resultsLayout === "list"

    return `
      <div class="boost-product-card" data-product-id="${product.id}">
        <a href="/products/${product.handle || product.id}" class="boost-product-link">
          <div class="boost-product-image-container">
            <img 
              src="${product.image || "/assets/placeholder.svg"}" 
              alt="${product.name}"
              class="boost-product-image"
              loading="lazy"
              onerror="this.src='/assets/placeholder.svg'"
            />
            ${product.badge ? `<div class="boost-product-badge">${product.badge}</div>` : ""}
          </div>
          
          <div class="boost-product-info">
            <h3 class="boost-product-title">${product.name}</h3>
            
            <div class="boost-product-price">
              ${
                product.compare_at_price && product.compare_at_price > product.price
                  ? `<span class="boost-price-compare">$${product.compare_at_price}</span>
                 <span class="boost-price-save">Save $${(product.compare_at_price - product.price).toFixed(2)}</span>`
                  : ""
              }
              <span class="boost-price-current">$${product.price}</span>
            </div>

            ${
              product.rating
                ? `
              <div class="boost-product-rating">
                <span class="boost-rating-stars">${"★".repeat(Math.floor(product.rating))}${"☆".repeat(5 - Math.floor(product.rating))}</span>
                <span class="boost-rating-count">(${product.reviews || 0})</span>
              </div>
            `
                : ""
            }

            ${
              product.tags && product.tags.length > 0
                ? `
              <div class="boost-product-tags">
                ${product.tags
                  .slice(0, 3)
                  .map((tag) => `<span class="boost-product-tag">${tag}</span>`)
                  .join("")}
              </div>
            `
                : ""
            }

            ${
              isListLayout
                ? `
              <div class="boost-product-description">
                ${product.description ? product.description.substring(0, 150) + "..." : ""}
              </div>
            `
                : ""
            }
          </div>
        </a>
        
        <div class="boost-product-actions">
          <button class="boost-btn boost-btn-primary" onclick="boostWidget.addToCart('${product.id}')">
            Add to Cart
          </button>
          <button class="boost-btn boost-btn-secondary" onclick="boostWidget.quickView('${product.id}')">
            Quick View
          </button>
        </div>
      </div>
    `
  }

  renderRecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) {
      this.recommendationsContainer.style.display = "none"
      return
    }

    const html = recommendations
      .map(
        (product) => `
      <div class="boost-recommendation-item">
        <a href="/products/${product.handle || product.id}">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
          <h4>${product.name}</h4>
          <span class="boost-price">$${product.price}</span>
        </a>
      </div>
    `,
      )
      .join("")

    this.recommendationsContainer.querySelector(".boost-recommendations-grid").innerHTML = html
    this.recommendationsContainer.style.display = "block"
  }

  renderPagination(pagination) {
    const { currentPage, totalPages, hasNext, hasPrevious } = pagination

    let html = `
      <button class="boost-pagination-btn" ${!hasPrevious ? "disabled" : ""} 
              onclick="boostWidget.goToPage(${currentPage - 1})">
        Previous
      </button>
    `

    // Page numbers
    const startPage = Math.max(1, currentPage - 2)
    const endPage = Math.min(totalPages, currentPage + 2)

    if (startPage > 1) {
      html += `<button class="boost-pagination-btn" onclick="boostWidget.goToPage(1)">1</button>`
      if (startPage > 2) {
        html += `<span class="boost-pagination-ellipsis">...</span>`
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `
        <button class="boost-pagination-btn ${i === currentPage ? "active" : ""}" 
                onclick="boostWidget.goToPage(${i})">
          ${i}
        </button>
      `
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += `<span class="boost-pagination-ellipsis">...</span>`
      }
      html += `<button class="boost-pagination-btn" onclick="boostWidget.goToPage(${totalPages})">${totalPages}</button>`
    }

    html += `
      <button class="boost-pagination-btn" ${!hasNext ? "disabled" : ""} 
              onclick="boostWidget.goToPage(${currentPage + 1})">
        Next
      </button>
    `

    this.paginationContainer.innerHTML = html
  }

  goToPage(page) {
    this.performSearch(this.state.currentQuery, page)
    this.container.scrollIntoView({ behavior: "smooth" })
  }

  setupLazyLoading() {
    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target
            img.src = img.dataset.src || img.src
            img.classList.remove("lazy")
            imageObserver.unobserve(img)
          }
        })
      })

      document.querySelectorAll('.boost-product-image[loading="lazy"]').forEach((img) => {
        imageObserver.observe(img)
      })
    }
  }

  // Filter management
  switchFilterTab(filterType) {
    // Update tab states
    document.querySelectorAll(".boost-filter-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.filter === filterType)
    })

    // Update panel states
    document.querySelectorAll(".boost-filter-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `boost-filter-${filterType}`)
    })
  }

  updateFilter(type, value, checked) {
    if (type === "category") {
      if (checked) {
        this.state.currentFilters.category = value
      } else {
        delete this.state.currentFilters.category
      }
    } else if (type === "tag") {
      if (!this.state.currentFilters.tags) {
        this.state.currentFilters.tags = []
      }

      if (checked) {
        this.state.currentFilters.tags.push(value)
      } else {
        this.state.currentFilters.tags = this.state.currentFilters.tags.filter((tag) => tag !== value)
      }

      if (this.state.currentFilters.tags.length === 0) {
        delete this.state.currentFilters.tags
      }
    } else if (type === "price") {
      this.state.currentFilters.minPrice = value.min
      this.state.currentFilters.maxPrice = value.max
    }

    this.updateActiveFilters()
    this.performSearch()
  }

  updateActiveFilters() {
    const container = document.querySelector(".boost-active-filters")
    if (!container) return

    const filters = []

    Object.entries(this.state.currentFilters).forEach(([key, value]) => {
      if (key === "tags" && Array.isArray(value)) {
        value.forEach((tag) => {
          filters.push({ type: "tag", value: tag, label: tag })
        })
      } else if (key === "category") {
        filters.push({ type: "category", value: value, label: `Category: ${value}` })
      } else if (key === "minPrice" || key === "maxPrice") {
        // Handle price range as a single filter
        if (key === "minPrice" && this.state.currentFilters.maxPrice) {
          filters.push({
            type: "price",
            value: { min: value, max: this.state.currentFilters.maxPrice },
            label: `$${value} - $${this.state.currentFilters.maxPrice}`,
          })
        }
      }
    })

    container.innerHTML = filters
      .map(
        (filter) => `
      <div class="boost-active-filter">
        <span>${filter.label}</span>
        <button class="boost-active-filter-remove" onclick="boostWidget.removeFilter('${filter.type}', '${JSON.stringify(filter.value).replace(/"/g, "&quot;")}')">
          ×
        </button>
      </div>
    `,
      )
      .join("")
  }

  removeFilter(type, value) {
    try {
      const parsedValue = JSON.parse(value.replace(/&quot;/g, '"'))

      if (type === "tag") {
        this.state.currentFilters.tags = this.state.currentFilters.tags.filter((tag) => tag !== parsedValue)
        if (this.state.currentFilters.tags.length === 0) {
          delete this.state.currentFilters.tags
        }
      } else if (type === "category") {
        delete this.state.currentFilters.category
      } else if (type === "price") {
        delete this.state.currentFilters.minPrice
        delete this.state.currentFilters.maxPrice
      }

      this.updateActiveFilters()
      this.performSearch()
    } catch (error) {
      console.error("Error removing filter:", error)
    }
  }

  showFilters() {
    if (this.filtersContainer) {
      this.filtersContainer.style.display = "block"
    }
  }

  hideFilters() {
    if (this.filtersContainer) {
      this.filtersContainer.style.display = "none"
    }
  }

  clearSearch() {
    this.searchInput.value = ""
    this.state.currentQuery = ""
    this.state.currentFilters = {}
    this.state.currentPage = 1
    this.hideSuggestions()
    this.hideFilters()
    this.updateActiveFilters()
    this.performSearch()
  }

  // Utility methods
  showLoading(show) {
    if (this.loadingContainer) {
      this.loadingContainer.style.display = show ? "block" : "none"
    }
    if (this.resultsContainer) {
      this.resultsContainer.style.opacity = show ? "0.5" : "1"
    }
  }

  renderError(message) {
    this.resultsContainer.innerHTML = `
      <div class="boost-error">
        <h3>Oops! Something went wrong</h3>
        <p>${message}</p>
        <button class="boost-btn boost-btn-primary" onclick="boostWidget.performSearch()">
          Try Again
        </button>
      </div>
    `
  }

  async loadInitialData() {
    try {
      // Load available filters and initial recommendations
      const response = await fetch(`${this.apiBase}/initial-data`)
      const data = await response.json()

      this.updateFilters(data.availableFilters)

      if (data.recommendations) {
        this.renderRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error("Failed to load initial data:", error)
    }
  }

  updateFilters(availableFilters) {
    if (!availableFilters) return

    // Update category filters
    const categoryPanel = document.getElementById("boost-filter-categories")
    if (categoryPanel && availableFilters.categories) {
      categoryPanel.innerHTML = `
        <div class="boost-filter-options">
          ${availableFilters.categories
            .map(
              (category) => `
            <label class="boost-filter-option">
              <input type="checkbox" value="${category}" onchange="boostWidget.updateFilter('category', this.value, this.checked)">
              <span>${category}</span>
            </label>
          `,
            )
            .join("")}
        </div>
      `
    }

    // Update brand filters
    const brandPanel = document.getElementById("boost-filter-brands")
    if (brandPanel && availableFilters.brands) {
      brandPanel.innerHTML = `
        <div class="boost-filter-options">
          ${availableFilters.brands
            .map(
              (brand) => `
            <label class="boost-filter-option">
              <input type="checkbox" value="${brand}" onchange="boostWidget.updateFilter('brand', this.value, this.checked)">
              <span>${brand}</span>
            </label>
          `,
            )
            .join("")}
        </div>
      `
    }

    // Update price range
    if (availableFilters.priceRange) {
      const minSlider = document.getElementById("boost-price-min")
      const maxSlider = document.getElementById("boost-price-max")
      const minDisplay = document.getElementById("boost-price-min-display")
      const maxDisplay = document.getElementById("boost-price-max-display")

      if (minSlider && maxSlider) {
        minSlider.min = availableFilters.priceRange.min
        minSlider.max = availableFilters.priceRange.max
        maxSlider.min = availableFilters.priceRange.min
        maxSlider.max = availableFilters.priceRange.max

        minSlider.value = this.state.currentFilters.minPrice || availableFilters.priceRange.min
        maxSlider.value = this.state.currentFilters.maxPrice || availableFilters.priceRange.max

        const updatePriceDisplay = () => {
          const min = Number.parseInt(minSlider.value)
          const max = Number.parseInt(maxSlider.value)

          if (minDisplay) minDisplay.textContent = `$${min}`
          if (maxDisplay) maxDisplay.textContent = `$${max}`

          this.updateFilter("price", { min, max }, true)
        }

        minSlider.addEventListener("input", updatePriceDisplay)
        maxSlider.addEventListener("input", updatePriceDisplay)
        updatePriceDisplay()
      }
    }
  }

  // E-commerce integration methods
  async addToCart(productId) {
    try {
      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: productId,
          quantity: 1,
        }),
      })

      if (response.ok) {
        this.showNotification("Product added to cart!", "success")
        this.updateCartCount()
      } else {
        throw new Error("Failed to add to cart")
      }
    } catch (error) {
      console.error("Add to cart failed:", error)
      this.showNotification("Failed to add product to cart", "error")
    }
  }

  async quickView(productId) {
    try {
      const response = await fetch(`/products/${productId}.js`)
      const product = await response.json()

      this.showQuickViewModal(product)
    } catch (error) {
      console.error("Quick view failed:", error)
    }
  }

  showQuickViewModal(product) {
    // Create and show quick view modal
    const modal = document.createElement("div")
    modal.className = "boost-modal boost-quickview-modal"
    modal.innerHTML = `
      <div class="boost-modal-content">
        <div class="boost-modal-header">
          <h3>${product.title}</h3>
          <button type="button" class="boost-close-btn" onclick="this.closest('.boost-modal').remove()">&times;</button>
        </div>
        <div class="boost-modal-body">
          <div class="boost-quickview-content">
            <div class="boost-quickview-images">
              <img src="${product.featured_image}" alt="${product.title}">
            </div>
            <div class="boost-quickview-details">
              <div class="boost-product-price">
                <span class="boost-price-current">$${(product.price / 100).toFixed(2)}</span>
              </div>
              <div class="boost-product-description">
                ${product.description}
              </div>
              <div class="boost-quickview-actions">
                <button class="boost-btn boost-btn-primary" onclick="boostWidget.addToCart('${product.variants[0].id}')">
                  Add to Cart
                </button>
                <a href="/products/${product.handle}" class="boost-btn boost-btn-secondary">
                  View Full Details
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(modal)
    modal.style.display = "flex"

    // Close on outside click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div")
    notification.className = `boost-notification boost-notification-${type}`
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">&times;</button>
    `

    document.body.appendChild(notification)

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove()
      }
    }, 3000)
  }

  async updateCartCount() {
    try {
      const response = await fetch("/cart.js")
      const cart = await response.json()

      // Update cart count in theme
      const cartCountElements = document.querySelectorAll(".cart-count, [data-cart-count]")
      cartCountElements.forEach((element) => {
        element.textContent = cart.item_count
      })
    } catch (error) {
      console.error("Failed to update cart count:", error)
    }
  }

  // Analytics
  async recordSearchAnalytics(query, resultCount) {
    try {
      await fetch(`${this.apiBase}/analytics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "search",
          query,
          resultCount,
          filters: this.state.currentFilters,
          timestamp: Date.now(),
          sessionId: this.getSessionId(),
        }),
      })
    } catch (error) {
      console.error("Analytics recording failed:", error)
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem("boost-session-id")
    if (!sessionId) {
      sessionId = "boost-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem("boost-session-id", sessionId)
    }
    return sessionId
  }
}

// Initialize widget when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".boost-search-container")) {
    window.boostWidget = new BoostSearchWidget()
  }
})

// Add notification styles
const notificationStyles = `
  .boost-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 10001;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideInRight 0.3s ease;
  }
  
  .boost-notification-success {
    background: #28a745;
  }
  
  .boost-notification-error {
    background: #dc3545;
  }
  
  .boost-notification-info {
    background: #007ace;
  }
  
  .boost-notification button {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 18px;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .boost-quickview-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  
  .boost-quickview-images img {
    width: 100%;
    border-radius: 8px;
  }
  
  .boost-quickview-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  @media (max-width: 768px) {
    .boost-quickview-content {
      grid-template-columns: 1fr;
    }
    
    .boost-notification {
      left: 20px;
      right: 20px;
      top: auto;
      bottom: 20px;
    }
  }
`

const styleSheet = document.createElement("style")
styleSheet.textContent = notificationStyles
document.head.appendChild(styleSheet)
