// Shared authentication and validation helpers
import { isValidShopDomain, securelyRetrieveAccessToken } from "./shopify"
import { errorTracker, ErrorSeverity } from "./error-handler"

export interface AuthValidationResult {
  isValid: boolean
  error?: string
  shopDomain?: string
  accessToken?: string
}

/**
 * Validate shop domain and access token for API requests
 */
export async function validateShopAuth(
  shopDomain: string | null,
  accessToken: string | null,
): Promise<AuthValidationResult> {
  // Validate shop domain
  if (!shopDomain) {
    return { isValid: false, error: "Missing shop domain" }
  }

  if (!isValidShopDomain(shopDomain)) {
    errorTracker.trackError(new Error("Invalid shop domain format"), ErrorSeverity.MEDIUM, { shopDomain })
    return { isValid: false, error: "Invalid shop domain format" }
  }

  // Validate access token
  if (!accessToken) {
    return { isValid: false, error: "Missing access token" }
  }

  // For production, you might want to validate the token with Shopify
  // For now, we'll do basic validation
  if (accessToken.length < 10) {
    return { isValid: false, error: "Invalid access token format" }
  }

  // Try to retrieve stored token if available
  let validatedToken = accessToken
  try {
    const storedToken = await securelyRetrieveAccessToken(shopDomain)
    if (storedToken) {
      validatedToken = storedToken
    }
  } catch (error) {
    console.warn(`Could not retrieve stored token for ${shopDomain}:`, error)
  }

  return {
    isValid: true,
    shopDomain,
    accessToken: validatedToken,
  }
}

/**
 * Generate a unique job ID
 */
export function generateJobId(prefix = "job"): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${timestamp}_${random}`
}

/**
 * Validate product schema for bulk operations
 */
export interface ProductValidationResult {
  isValid: boolean
  errors: string[]
  validProducts: any[]
  invalidProducts: Array<{ product: any; errors: string[] }>
}

export function validateProductsSchema(products: any[]): ProductValidationResult {
  const result: ProductValidationResult = {
    isValid: true,
    errors: [],
    validProducts: [],
    invalidProducts: [],
  }

  if (!Array.isArray(products)) {
    result.isValid = false
    result.errors.push("Products must be an array")
    return result
  }

  if (products.length === 0) {
    result.isValid = false
    result.errors.push("Products array cannot be empty")
    return result
  }

  if (products.length > 1000) {
    result.isValid = false
    result.errors.push("Cannot process more than 1000 products at once")
    return result
  }

  products.forEach((product, index) => {
    const productErrors: string[] = []

    // Required fields validation
    if (!product.id) {
      productErrors.push("Missing required field: id")
    }

    if (!product.title || typeof product.title !== "string") {
      productErrors.push("Missing or invalid required field: title")
    }

    if (product.price !== undefined && (typeof product.price !== "number" || product.price < 0)) {
      productErrors.push("Invalid price: must be a positive number")
    }

    // Optional field validation
    if (product.variants && !Array.isArray(product.variants)) {
      productErrors.push("Invalid variants: must be an array")
    }

    if (product.tags && !Array.isArray(product.tags)) {
      productErrors.push("Invalid tags: must be an array")
    }

    if (productErrors.length > 0) {
      result.invalidProducts.push({
        product: { ...product, index },
        errors: productErrors,
      })
      result.isValid = false
    } else {
      result.validProducts.push(product)
    }
  })

  if (result.invalidProducts.length > 0) {
    result.errors.push(`${result.invalidProducts.length} products failed validation`)
  }

  return result
}

/**
 * Parse date range from query parameters
 */
export interface DateRange {
  from: Date
  to: Date
}

export function parseDateRange(fromParam: string | null, toParam: string | null): DateRange {
  const now = new Date()
  const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago

  let from = defaultFrom
  let to = now

  if (fromParam) {
    const parsedFrom = new Date(fromParam)
    if (!isNaN(parsedFrom.getTime())) {
      from = parsedFrom
    }
  }

  if (toParam) {
    const parsedTo = new Date(toParam)
    if (!isNaN(parsedTo.getTime())) {
      to = parsedTo
    }
  }

  // Ensure from is before to
  if (from > to) {
    ;[from, to] = [to, from]
  }

  return { from, to }
}

/**
 * Chunk array into smaller batches
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}
