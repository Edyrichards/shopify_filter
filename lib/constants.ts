// Application constants and configuration

export const SECURITY_CONFIG = {
  // Content Security Policy
  CSP: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.shopify.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.shopify.com https://cdn.shopify.com; connect-src 'self' https://*.shopify.com; frame-ancestors https://*.shopify.com https://admin.shopify.com;",

  // Security Headers
  HEADERS: {
    "X-Frame-Options": "SAMEORIGIN", // Allow framing from Shopify
    "X-XSS-Protection": "1; mode=block",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  },
} as const

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
} as const

export const SHOPIFY_CONFIG = {
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
} as const

export const DATABASE_CONFIG = {
  // Connection pool settings
  POOL_SIZE: 20,
  CONNECTION_TIMEOUT: 30000,
  IDLE_TIMEOUT: 600000,
} as const

export const CACHE_CONFIG = {
  // Cache TTL settings
  PRODUCT_TTL: 5 * 60 * 1000, // 5 minutes
  SHOP_TTL: 60 * 60 * 1000, // 1 hour
  TOKEN_TTL: 24 * 60 * 60 * 1000, // 24 hours
} as const
