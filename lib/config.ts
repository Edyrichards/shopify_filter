// Centralized configuration for the Shopify app
// This file handles all environment variables and configuration settings

// Environment variable validation - only validate at runtime, not build time
function requireEnv(name: string): string {
  // Skip validation during build time
  if (process.env.NODE_ENV === undefined || process.env.NEXT_PHASE === "phase-production-build") {
    return ""
  }

  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// Safe environment variable getter
function getEnv(name: string, defaultValue = ""): string {
  return process.env[name] || defaultValue
}

// App environment
export const NODE_ENV = process.env.NODE_ENV || "development"
export const IS_PRODUCTION = NODE_ENV === "production"
export const IS_DEVELOPMENT = NODE_ENV === "development"

// Application URLs and endpoints
export const HOST = getEnv("HOST", IS_PRODUCTION ? "" : "http://localhost:3000")
export const APP_URL = HOST ? new URL(HOST).origin : ""

// Shopify configuration
export const SHOPIFY_CONFIG = {
  // API credentials - use safe getters
  API_KEY: getEnv("SHOPIFY_API_KEY"),
  API_SECRET_KEY: getEnv("SHOPIFY_API_SECRET_KEY"),

  // OAuth scopes required by the app
  SCOPES: [
    "read_products",
    "write_products",
    "read_inventory",
    "write_inventory",
    "read_product_listings",
    "read_collection_listings",
    "read_customers",
    "read_orders",
    "read_analytics",
  ].join(","),

  // API version
  API_VERSION: "2023-10",

  // Webhook topics
  WEBHOOK_TOPICS: [
    "products/create",
    "products/update",
    "products/delete",
    "inventory_levels/update",
    "app/uninstalled",
  ],

  // Webhook secret for validation
  WEBHOOK_SECRET: getEnv("SHOPIFY_WEBHOOK_SECRET"),

  // OAuth callback URL
  OAUTH_CALLBACK_URL: `${APP_URL}/api/shopify/callback`,

  // App Bridge configuration
  APP_BRIDGE_URL: "https://cdn.shopify.com/shopifycloud/app-bridge-api/v3/app-bridge.js",
}

// Security configuration
export const SECURITY_CONFIG = {
  // Encryption key for sensitive data
  ENCRYPTION_KEY: getEnv("ENCRYPTION_KEY"),

  // Content Security Policy
  CSP: `default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.shopify.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.shopify.com https://cdn.shopify.com; connect-src 'self' https://*.shopify.com; frame-ancestors https://*.shopify.com https://admin.shopify.com;`,

  // Security Headers
  HEADERS: {
    "X-Frame-Options": "SAMEORIGIN", // Allow framing from Shopify
    "X-XSS-Protection": "1; mode=block",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  },

  // JWT configuration for session management
  JWT_SECRET: getEnv("JWT_SECRET") || getEnv("ENCRYPTION_KEY"), // Fallback to encryption key
  JWT_EXPIRY: "24h",
}

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  // API endpoints rate limiting
  API: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },

  // Webhook endpoints rate limiting
  WEBHOOKS: {
    maxRequests: 500,
    windowMs: 60 * 1000, // 1 minute
  },

  // OAuth endpoints rate limiting
  OAUTH: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  },

  // Install endpoints rate limiting
  INSTALL: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
}

// Database configuration
export const DATABASE_CONFIG = {
  // Connection pool settings
  POOL_SIZE: 20,
  CONNECTION_TIMEOUT: 30000,
  IDLE_TIMEOUT: 600000,

  // Database URL
  DATABASE_URL: getEnv("DATABASE_URL"),
}

// Cache configuration
export const CACHE_CONFIG = {
  // Cache TTL settings
  PRODUCT_TTL: 5 * 60 * 1000, // 5 minutes
  SHOP_TTL: 60 * 60 * 1000, // 1 hour
  TOKEN_TTL: 24 * 60 * 60 * 1000, // 24 hours
}

// Typesense configuration
export const TYPESENSE_CONFIG = {
  API_KEY: getEnv("TYPESENSE_API_KEY"),
  HOST: getEnv("TYPESENSE_HOST", "localhost"),
  PORT: getEnv("TYPESENSE_PORT") ? Number.parseInt(getEnv("TYPESENSE_PORT")) : 8108,
  PROTOCOL: getEnv("TYPESENSE_PROTOCOL", "http"),

  // Collection configurations
  COLLECTIONS: {
    PRODUCTS: "products",
    SEARCH_QUERIES: "search_queries",
  },

  // Default search parameters
  DEFAULT_SEARCH_PARAMS: {
    query_by: "title,description,tags",
    sort_by: "_text_match:desc",
    per_page: 20,
  },
}

// Notification configuration
export const NOTIFICATION_CONFIG = {
  SLACK_WEBHOOK_URL: getEnv("SLACK_WEBHOOK_URL"),
}

// Analytics configuration
export const ANALYTICS_CONFIG = {
  ENABLED: true,
  RETENTION_DAYS: 90,
}

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_AI_SEARCH: true,
  ENABLE_ADVANCED_FILTERS: true,
  ENABLE_REAL_TIME_SYNC: true,
  ENABLE_ANALYTICS: true,
  ENABLE_TYPESENSE: !!TYPESENSE_CONFIG.API_KEY,
}

// Runtime validation function - call this in API routes that need specific env vars
export function validateRequiredEnvVars(requiredVars: string[]) {
  const missing = requiredVars.filter((varName) => !process.env[varName])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }
}
