// Advanced search endpoint with AI-powered features
import { NextResponse } from "next/server"
import { filterProducts, type FilterOptions, type ProductSearchResponse } from "@/lib/product-filter"
import { performAISearch } from "@/lib/ai-search"

// Import the same product data
const products = [
  {
    id: 1,
    name: "Classic T-Shirt",
    price: 19.99,
    category: "Clothing",
    tags: ["bestseller", "summer", "cotton"],
    image: "/placeholder.svg?height=200&width=200&text=T-Shirt",
    rating: 4.5,
    reviews: 24,
    variants: [
      { id: 101, color: "Black", size: "M", inventory: 10 },
      { id: 102, color: "White", size: "L", inventory: 5 },
      { id: 103, color: "Red", size: "S", inventory: 8 },
    ],
  },
  {
    id: 2,
    name: "Running Shoes",
    price: 89.99,
    category: "Shoes",
    tags: ["sports", "new", "breathable"],
    image: "/placeholder.svg?height=200&width=200&text=Shoes",
    rating: 4.8,
    reviews: 36,
    variants: [
      { id: 201, color: "Black", size: "42", inventory: 3 },
      { id: 202, color: "Blue", size: "43", inventory: 7 },
      { id: 203, color: "White", size: "44", inventory: 2 },
    ],
  },
  // ... rest of products
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query, filters = {}, useAI = false } = body

    // Set defaults for pagination
    const filterOptions: FilterOptions = {
      ...filters,
      search: query,
      offset: filters.offset || 0,
      limit: filters.limit || 10,
    }

    let result: ProductSearchResponse

    if (useAI && query) {
      // Use AI-powered search
      const aiResult = await performAISearch({
        query,
        filters: filterOptions,
        limit: filterOptions.limit,
        page: Math.floor((filterOptions.offset || 0) / (filterOptions.limit || 10)) + 1,
      })

      // Convert AI result to our standard format
      result = {
        products: aiResult.products,
        pagination: {
          offset: filterOptions.offset || 0,
          limit: filterOptions.limit || 10,
          total: aiResult.totalResults,
          hasNext: (filterOptions.offset || 0) + (filterOptions.limit || 10) < aiResult.totalResults,
          hasPrevious: (filterOptions.offset || 0) > 0,
          totalPages: Math.ceil(aiResult.totalResults / (filterOptions.limit || 10)),
          currentPage: Math.floor((filterOptions.offset || 0) / (filterOptions.limit || 10)) + 1,
        },
        appliedFilters: {
          search: query,
          ...filters,
        },
        availableFilters: {
          categories: ["Clothing", "Shoes", "Accessories"],
          priceRange: { min: 0, max: 500 },
          tags: Array.from(new Set(products.flatMap((p) => p.tags))),
          sortOptions: [
            { value: "relevance", label: "Most Relevant" },
            { value: "price_asc", label: "Price: Low to High" },
            { value: "price_desc", label: "Price: High to Low" },
            { value: "rating_desc", label: "Highest Rated" },
          ],
        },
      }

      // Add AI-specific data
      result.aiData = {
        suggestedQueries: aiResult.suggestedQueries,
        didYouMean: aiResult.didYouMean,
        facets: aiResult.facets,
      }
    } else {
      // Use standard filtering
      result = filterProducts(products, filterOptions)
    }

    return NextResponse.json({
      ...result,
      searchQuery: query,
      useAI,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in search API:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
