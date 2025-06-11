// Type definitions for the application
export interface Product {
  id: string
  shopifyId: string
  shopDomain: string
  title: string
  handle: string
  description: string
  vendor: string
  productType: string
  tags: string[]
  status: "active" | "archived" | "draft"
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  images: ProductImage[]
  variants: ProductVariant[]
  metafields: ProductMetafield[]
  seo: {
    title?: string
    description?: string
  }
}

export interface ProductVariant {
  id: string
  shopifyId: string
  productId: string
  title: string
  price: number
  compareAtPrice?: number
  sku?: string
  barcode?: string
  inventoryQuantity: number
  inventoryPolicy: "deny" | "continue"
  inventoryManagement: "shopify" | "not_managed"
  weight: number
  weightUnit: "kg" | "lb" | "oz" | "g"
  position: number
  option1?: string
  option2?: string
  option3?: string
  createdAt: Date
  updatedAt: Date
}

export interface ProductImage {
  id: string
  shopifyId: string
  productId: string
  src: string
  alt?: string
  position: number
  width: number
  height: number
  createdAt: Date
  updatedAt: Date
}

export interface ProductMetafield {
  id: string
  shopifyId: string
  productId: string
  namespace: string
  key: string
  value: string
  type: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface InventoryLevel {
  id: string
  shopifyInventoryItemId: string
  shopifyLocationId: string
  variantId: string
  available: number
  reserved: number
  onHand: number
  committed: number
  incoming: number
  updatedAt: Date
}

export interface SyncLog {
  id: string
  shopDomain: string
  eventType: string
  shopifyId: string
  status: "success" | "error" | "pending"
  errorMessage?: string
  retryCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Shop {
  id: string
  shopDomain: string
  accessToken: string
  isActive: boolean
  installedAt: Date
  updatedAt: Date
  lastSyncAt?: Date
  plan: string
  email?: string
  country?: string
  currency?: string
  owner?: string
  timezone?: string
}

export interface ShopSettings {
  id: string
  shopId: string
  enableAISearch: boolean
  enableAdvancedFilters: boolean
  enableRecommendations: boolean
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  borderRadius: string
  enablePreorders: boolean
  enableRealTimeSync: boolean
  enableAnalytics: boolean
  createdAt: Date
  updatedAt: Date
}

export interface InstallSession {
  id: string
  shopDomain: string
  state: string
  isCompleted: boolean
  createdAt: Date
  expiresAt: Date
}
