// Database schema definitions using Prisma-style models

export interface Product {
  id: string
  title: string
  description: string
  price: number
  imageUrl: string
  shopId: string
}

export interface SyncLog {
  id: string
  shopId: string
  startTime: Date
  endTime: Date
  status: string
  message: string
}

export interface Shop {
  id: string
  shopDomain: string
  accessToken: string // encrypted
  scope: string
  isActive: boolean
  installedAt: Date
  updatedAt: Date

  // App settings
  settings: ShopSettings

  // Relations
  products: Product[]
  syncLogs: SyncLog[]
}

export interface ShopSettings {
  id: string
  shopId: string

  // Search & Filter settings
  enableAISearch: boolean
  enableAdvancedFilters: boolean
  enableRecommendations: boolean

  // UI customization
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  borderRadius: string

  // Feature flags
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
  hmac: string
  timestamp: string
  isCompleted: boolean
  createdAt: Date
  expiresAt: Date
}
