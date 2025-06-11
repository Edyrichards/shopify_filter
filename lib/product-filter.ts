// Reusable product filtering and search logic

export interface Product {
  id: number
  name: string
  price: number
  category: string
  tags: string[]
  image: string
  rating: number
  reviews: number
  variants: Array<{
    id: number
    color: string
    size: string
    inventory: number
  }>
}

export interface FilterOptions {
  category?: string | null
  minPrice?: number
  maxPrice?: number
  search?: string | null
  tags?: string[]
  sort?: "price_asc" | "price_desc" | "name_asc" | "name_desc" | "rating_desc" | null
  offset?: number
  limit?: number
}

export interface AppliedFilters {
  category?: string
  priceRange?: {
    min?: number
    max?: number
  }
  search?: string
  tags?: string[]
  sort?: string
}

export interface PaginationInfo {
  offset: number
  limit: number
  total: number
  hasNext: boolean
  hasPrevious: boolean
  totalPages: number
  currentPage: number
}

export interface ProductSearchResponse {
  products: Product[]
  pagination: PaginationInfo
  appliedFilters: AppliedFilters
  availableFilters: {
    categories: string[]
    priceRange: {
      min: number
      max: number
    }
    tags: string[]
    sortOptions: Array<{
      value: string
      label: string
    }>
  }
}

/**
 * Filter and search products based on provided options
 */
export function filterProducts(products: Product[], options: FilterOptions): ProductSearchResponse {
  const { category, minPrice, maxPrice, search, tags, sort, offset = 0, limit = 10 } = options

  // Start with all products
  let filteredProducts = [...products]

  // Apply category filter
  if (category) {
    filteredProducts = filteredProducts.filter((p) => p.category.toLowerCase() === category.toLowerCase())
  }

  // Apply price range filter
  if (minPrice !== undefined) {
    filteredProducts = filteredProducts.filter((p) => p.price >= minPrice)
  }

  if (maxPrice !== undefined) {
    filteredProducts = filteredProducts.filter((p) => p.price <= maxPrice)
  }

  // Apply search filter
  if (search) {
    const searchTerm = search.toLowerCase()
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm) ||
        p.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),
    )
  }

  // Apply tags filter (products must have ALL specified tags)
  if (tags && tags.length > 0) {
    filteredProducts = filteredProducts.filter((p) =>
      tags.every((tag) => p.tags.some((productTag) => productTag.toLowerCase().includes(tag.toLowerCase()))),
    )
  }

  // Apply sorting
  if (sort) {
    filteredProducts = sortProducts(filteredProducts, sort)
  }

  // Calculate pagination
  const total = filteredProducts.length
  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1
  const hasNext = offset + limit < total
  const hasPrevious = offset > 0

  // Apply pagination
  const paginatedProducts = filteredProducts.slice(offset, offset + limit)

  // Build applied filters object
  const appliedFilters: AppliedFilters = {}

  if (category) appliedFilters.category = category
  if (minPrice !== undefined || maxPrice !== undefined) {
    appliedFilters.priceRange = {}
    if (minPrice !== undefined) appliedFilters.priceRange.min = minPrice
    if (maxPrice !== undefined) appliedFilters.priceRange.max = maxPrice
  }
  if (search) appliedFilters.search = search
  if (tags && tags.length > 0) appliedFilters.tags = tags
  if (sort) appliedFilters.sort = sort

  // Generate available filters from all products (not just filtered ones)
  const availableFilters = generateAvailableFilters(products)

  return {
    products: paginatedProducts,
    pagination: {
      offset,
      limit,
      total,
      hasNext,
      hasPrevious,
      totalPages,
      currentPage,
    },
    appliedFilters,
    availableFilters,
  }
}

/**
 * Sort products based on the specified sort option
 */
function sortProducts(products: Product[], sort: string): Product[] {
  const sortedProducts = [...products]

  switch (sort) {
    case "price_asc":
      return sortedProducts.sort((a, b) => a.price - b.price)

    case "price_desc":
      return sortedProducts.sort((a, b) => b.price - a.price)

    case "name_asc":
      return sortedProducts.sort((a, b) => a.name.localeCompare(b.name))

    case "name_desc":
      return sortedProducts.sort((a, b) => b.name.localeCompare(a.name))

    case "rating_desc":
      return sortedProducts.sort((a, b) => b.rating - a.rating)

    default:
      return sortedProducts
  }
}

/**
 * Generate available filter options from all products
 */
function generateAvailableFilters(products: Product[]) {
  const categories = Array.from(new Set(products.map((p) => p.category)))
  const allTags = Array.from(new Set(products.flatMap((p) => p.tags)))
  const prices = products.map((p) => p.price)

  return {
    categories: categories.sort(),
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices),
    },
    tags: allTags.sort(),
    sortOptions: [
      { value: "price_asc", label: "Price: Low to High" },
      { value: "price_desc", label: "Price: High to Low" },
      { value: "name_asc", label: "Name: A to Z" },
      { value: "name_desc", label: "Name: Z to A" },
      { value: "rating_desc", label: "Highest Rated" },
    ],
  }
}

/**
 * Build query string from filter options
 */
export function buildQueryString(options: Partial<FilterOptions>): string {
  const params = new URLSearchParams()

  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(","))
        }
      } else {
        params.set(key, value.toString())
      }
    }
  })

  return params.toString()
}

/**
 * Parse query string into filter options
 */
export function parseQueryString(queryString: string): Partial<FilterOptions> {
  const params = new URLSearchParams(queryString)
  const options: Partial<FilterOptions> = {}

  const category = params.get("category")
  if (category) options.category = category

  const minPrice = params.get("minPrice")
  if (minPrice) options.minPrice = Number(minPrice)

  const maxPrice = params.get("maxPrice")
  if (maxPrice) options.maxPrice = Number(maxPrice)

  const search = params.get("search")
  if (search) options.search = search

  const tags = params.get("tags")
  if (tags)
    options.tags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)

  const sort = params.get("sort")
  if (sort) options.sort = sort as FilterOptions["sort"]

  const offset = params.get("offset")
  if (offset) options.offset = Number(offset)

  const limit = params.get("limit")
  if (limit) options.limit = Number(limit)

  return options
}

/**
 * Get next page offset
 */
export function getNextPageOffset(currentOffset: number, limit: number, total: number): number | null {
  const nextOffset = currentOffset + limit
  return nextOffset < total ? nextOffset : null
}

/**
 * Get previous page offset
 */
export function getPreviousPageOffset(currentOffset: number, limit: number): number | null {
  const prevOffset = currentOffset - limit
  return prevOffset >= 0 ? prevOffset : null
}

/**
 * Calculate page number from offset and limit
 */
export function getPageNumber(offset: number, limit: number): number {
  return Math.floor(offset / limit) + 1
}

/**
 * Calculate offset from page number and limit
 */
export function getOffsetFromPage(page: number, limit: number): number {
  return (page - 1) * limit
}
