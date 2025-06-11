import { Client as TypesenseClient } from "typesense"
import { TYPESENSE_CONFIG } from "./config"

// Define product schema for Typesense
export interface TypesenseProduct {
  id: string
  title: string
  description: string
  price: number
  compare_at_price?: number
  vendor: string
  product_type: string
  tags: string[]
  variants: {
    id: string
    title: string
    price: number
    sku: string
    inventory_quantity: number
    options: string[]
  }[]
  options: {
    name: string
    values: string[]
  }[]
  images: {
    id: string
    src: string
    alt?: string
  }[]
  handle: string
  status: string
  published_at: string
  created_at: string
  updated_at: string
}

// Define search query schema for analytics
export interface SearchQuery {
  id: string
  query: string
  filters?: Record<string, any>
  results_count: number
  shop_id: string
  user_id?: string
  session_id: string
  timestamp: number
  converted: boolean
  conversion_product_id?: string
}

// Initialize Typesense client
export const typesenseClient = new TypesenseClient({
  nodes: [
    {
      host: TYPESENSE_CONFIG.HOST,
      port: TYPESENSE_CONFIG.PORT,
      protocol: TYPESENSE_CONFIG.PROTOCOL,
    },
  ],
  apiKey: TYPESENSE_CONFIG.API_KEY,
  connectionTimeoutSeconds: 10,
})

// Check if Typesense is enabled and configured
export const isTypesenseEnabled = (): boolean => {
  return !!TYPESENSE_CONFIG.API_KEY
}

// Initialize Typesense collections
export async function initializeTypesense(): Promise<void> {
  if (!isTypesenseEnabled()) {
    console.log("Typesense is not enabled. Skipping initialization.")
    return
  }

  try {
    // Create products collection if it doesn't exist
    try {
      await typesenseClient.collections(TYPESENSE_CONFIG.COLLECTIONS.PRODUCTS).retrieve()
      console.log("Products collection already exists")
    } catch (error) {
      console.log("Creating products collection...")
      await typesenseClient.collections().create({
        name: TYPESENSE_CONFIG.COLLECTIONS.PRODUCTS,
        fields: [
          { name: "title", type: "string" },
          { name: "description", type: "string", optional: true },
          { name: "price", type: "float" },
          { name: "compare_at_price", type: "float", optional: true },
          { name: "vendor", type: "string", facet: true },
          { name: "product_type", type: "string", facet: true },
          { name: "tags", type: "string[]", facet: true },
          { name: "options", type: "object[]" },
          { name: "variants", type: "object[]" },
          { name: "images", type: "object[]" },
          { name: "handle", type: "string" },
          { name: "status", type: "string", facet: true },
          { name: "published_at", type: "string" },
          { name: "created_at", type: "string" },
          { name: "updated_at", type: "string" },
          { name: "shop_id", type: "string", facet: true },
        ],
        default_sorting_field: "created_at",
      })
    }

    // Create search queries collection if it doesn't exist
    try {
      await typesenseClient.collections(TYPESENSE_CONFIG.COLLECTIONS.SEARCH_QUERIES).retrieve()
      console.log("Search queries collection already exists")
    } catch (error) {
      console.log("Creating search queries collection...")
      await typesenseClient.collections().create({
        name: TYPESENSE_CONFIG.COLLECTIONS.SEARCH_QUERIES,
        fields: [
          { name: "query", type: "string" },
          { name: "filters", type: "object", optional: true },
          { name: "results_count", type: "int32" },
          { name: "shop_id", type: "string", facet: true },
          { name: "user_id", type: "string", facet: true, optional: true },
          { name: "session_id", type: "string" },
          { name: "timestamp", type: "int64" },
          { name: "converted", type: "bool", facet: true },
          { name: "conversion_product_id", type: "string", optional: true },
        ],
        default_sorting_field: "timestamp",
      })
    }

    console.log("Typesense initialization complete")
  } catch (error) {
    console.error("Failed to initialize Typesense:", error)
    throw error
  }
}

// Index a product in Typesense
export async function indexProduct(product: TypesenseProduct, shopId: string): Promise<void> {
  if (!isTypesenseEnabled()) return

  try {
    // Add shop_id to the product
    const productWithShopId = {
      ...product,
      shop_id: shopId,
    }

    await typesenseClient.collections(TYPESENSE_CONFIG.COLLECTIONS.PRODUCTS).documents().upsert(productWithShopId)
  } catch (error) {
    console.error(`Failed to index product ${product.id}:`, error)
    throw error
  }
}

// Delete a product from Typesense
export async function deleteProduct(productId: string): Promise<void> {
  if (!isTypesenseEnabled()) return

  try {
    await typesenseClient.collections(TYPESENSE_CONFIG.COLLECTIONS.PRODUCTS).documents(productId).delete()
  } catch (error) {
    console.error(`Failed to delete product ${productId}:`, error)
    throw error
  }
}

// Search products in Typesense
export async function searchProducts(
  query: string,
  options: {
    filters?: string
    sortBy?: string
    page?: number
    perPage?: number
    facets?: string[]
  } = {},
): Promise<any> {
  if (!isTypesenseEnabled()) {
    throw new Error("Typesense is not enabled")
  }

  const {
    filters = "",
    sortBy = TYPESENSE_CONFIG.DEFAULT_SEARCH_PARAMS.sort_by,
    page = 1,
    perPage = TYPESENSE_CONFIG.DEFAULT_SEARCH_PARAMS.per_page,
    facets = ["product_type", "vendor", "tags"],
  } = options

  try {
    const searchParameters = {
      q: query,
      query_by: TYPESENSE_CONFIG.DEFAULT_SEARCH_PARAMS.query_by,
      sort_by: sortBy,
      page,
      per_page: perPage,
      facet_by: facets.join(","),
      filter_by: filters,
    }

    return await typesenseClient.collections(TYPESENSE_CONFIG.COLLECTIONS.PRODUCTS).documents().search(searchParameters)
  } catch (error) {
    console.error(`Failed to search products with query "${query}":`, error)
    throw error
  }
}

// Record a search query for analytics
export async function recordSearchQuery(searchQuery: Omit<SearchQuery, "id">): Promise<void> {
  if (!isTypesenseEnabled()) return

  try {
    const id = `${searchQuery.shop_id}_${searchQuery.session_id}_${Date.now()}`
    await typesenseClient
      .collections(TYPESENSE_CONFIG.COLLECTIONS.SEARCH_QUERIES)
      .documents()
      .create({
        id,
        ...searchQuery,
      })
  } catch (error) {
    console.error("Failed to record search query:", error)
    // Don't throw error to prevent disrupting the user experience
  }
}

// Get search analytics for a shop
export async function getSearchAnalytics(
  shopId: string,
  options: {
    startDate?: Date
    endDate?: Date
    limit?: number
  } = {},
): Promise<any> {
  if (!isTypesenseEnabled()) {
    throw new Error("Typesense is not enabled")
  }

  const { startDate, endDate, limit = 100 } = options

  let filter = `shop_id:=${shopId}`

  if (startDate) {
    filter += ` && timestamp:>=${Math.floor(startDate.getTime() / 1000)}`
  }

  if (endDate) {
    filter += ` && timestamp:<=${Math.floor(endDate.getTime() / 1000)}`
  }

  try {
    const searchParameters = {
      q: "*",
      query_by: "query",
      filter_by: filter,
      sort_by: "timestamp:desc",
      per_page: limit,
      facet_by: "converted",
    }

    return await typesenseClient
      .collections(TYPESENSE_CONFIG.COLLECTIONS.SEARCH_QUERIES)
      .documents()
      .search(searchParameters)
  } catch (error) {
    console.error(`Failed to get search analytics for shop ${shopId}:`, error)
    throw error
  }
}

// Initialize Typesense on server startup
if (typeof window === "undefined") {
  // Only run in Node.js environment
  initializeTypesense().catch(console.error)
}
