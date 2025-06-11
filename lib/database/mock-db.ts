// Mock database implementation that doesn't use Prisma
import type { Product, ProductVariant, InventoryLevel, SyncLog } from "../types"

export class MockDatabase {
  private static instance: MockDatabase
  private products: Map<string, Product> = new Map()
  private variants: Map<string, ProductVariant> = new Map()
  private inventoryLevels: Map<string, InventoryLevel> = new Map()
  private syncLogs: Map<string, SyncLog> = new Map()
  private shops: Map<string, any> = new Map()
  private settings: Map<string, any> = new Map()

  // Add indexes for faster lookups
  private productIndexByShopify = new Map<string, string>() // shopifyId -> id
  private variantIndexByProduct = new Map<string, string[]>() // productId -> variantIds[]
  private inventoryIndexByVariant = new Map<string, string[]>() // variantId -> inventoryIds[]
  private productIndexByShop = new Map<string, string[]>() // shopDomain -> productIds[]

  private constructor() {}

  static getInstance(): MockDatabase {
    if (!MockDatabase.instance) {
      MockDatabase.instance = new MockDatabase()
    }
    return MockDatabase.instance
  }

  async getProduct(shopifyId: string, shopDomain: string): Promise<Product | null> {
    const key = `${shopDomain}-${shopifyId}`
    return this.products.get(key) || null
  }

  async saveProduct(product: Product): Promise<void> {
    const key = `${product.shopDomain}-${product.shopifyId}`
    this.products.set(key, product)
    this.productIndexByShopify.set(product.shopifyId, key)

    // Update shop index
    const shopProducts = this.productIndexByShop.get(product.shopDomain) || []
    if (!shopProducts.includes(key)) {
      shopProducts.push(key)
      this.productIndexByShop.set(product.shopDomain, shopProducts)
    }

    // Update variant index
    const variantIds = product.variants.map((v) => v.id)
    this.variantIndexByProduct.set(product.id, variantIds)
  }

  async deleteProduct(shopifyId: string, shopDomain: string): Promise<void> {
    const key = `${shopDomain}-${shopifyId}`
    this.products.delete(key)
  }

  async getVariant(shopifyId: string): Promise<ProductVariant | null> {
    return this.variants.get(shopifyId) || null
  }

  async saveVariant(variant: ProductVariant): Promise<void> {
    this.variants.set(variant.shopifyId, variant)
  }

  async getInventoryLevel(inventoryItemId: string, locationId: string): Promise<InventoryLevel | null> {
    const key = `${inventoryItemId}-${locationId}`
    return this.inventoryLevels.get(key) || null
  }

  async saveInventoryLevel(inventoryLevel: InventoryLevel): Promise<void> {
    const key = `${inventoryLevel.shopifyInventoryItemId}-${inventoryLevel.shopifyLocationId}`
    this.inventoryLevels.set(key, inventoryLevel)
  }

  async saveSyncLog(log: SyncLog): Promise<void> {
    this.syncLogs.set(log.id, log)
  }

  async getProductsByShop(shopDomain: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter((p) => p.shopDomain === shopDomain)
  }

  async getSyncLogs(shopDomain: string, limit = 50): Promise<SyncLog[]> {
    return Array.from(this.syncLogs.values())
      .filter((log) => log.shopDomain === shopDomain)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  async getProductsByTag(tag: string, shopDomain: string): Promise<Product[]> {
    // Use a more efficient approach with proper indexing
    const shopProducts = this.productIndexByShop.get(shopDomain) || []
    return shopProducts
      .map((productId) => this.products.get(productId))
      .filter((product) => product && product.tags.includes(tag))
      .filter(Boolean) as Product[]
  }

  async getProductsWithLowInventory(shopDomain: string, threshold = 5): Promise<Product[]> {
    // Optimized query for low inventory products
    const result: Product[] = []
    const products = await this.getProductsByShop(shopDomain)

    for (const product of products) {
      const hasLowInventory = product.variants.some((variant) => {
        const inventoryItem = Array.from(this.inventoryLevels.values()).find((inv) => inv.variantId === variant.id)
        return inventoryItem && inventoryItem.available <= threshold
      })

      if (hasLowInventory) {
        result.push(product)
      }
    }

    return result
  }

  // Bulk operations for better performance
  async bulkSaveProducts(products: Product[]): Promise<void> {
    for (const product of products) {
      await this.saveProduct(product)
    }
  }

  async bulkSaveVariants(variants: ProductVariant[]): Promise<void> {
    for (const variant of variants) {
      await this.saveVariant(variant)
    }
  }

  // Shop operations
  async createShop(shopData: any): Promise<any> {
    const shop = {
      id: `shop_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      ...shopData,
      installedAt: new Date(),
      updatedAt: new Date(),
    }
    this.shops.set(shop.shopDomain, shop)
    return shop
  }

  async getShopByDomain(shopDomain: string): Promise<any | null> {
    return this.shops.get(shopDomain) || null
  }

  async updateShop(shopDomain: string, updates: any): Promise<any | null> {
    const shop = this.shops.get(shopDomain)
    if (!shop) return null

    const updatedShop = {
      ...shop,
      ...updates,
      updatedAt: new Date(),
    }

    this.shops.set(shopDomain, updatedShop)
    return updatedShop
  }

  // Settings operations
  async createDefaultSettings(shopId: string): Promise<any> {
    const settings = {
      id: `settings_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      shopId,
      enableAISearch: true,
      enableAdvancedFilters: true,
      enableRecommendations: true,
      primaryColor: "#000000",
      secondaryColor: "#666666",
      fontFamily: "system-ui",
      borderRadius: "4px",
      enablePreorders: false,
      enableRealTimeSync: true,
      enableAnalytics: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.settings.set(shopId, settings)
    return settings
  }

  async getShopSettings(shopId: string): Promise<any | null> {
    return this.settings.get(shopId) || null
  }

  async updateShopSettings(shopId: string, updates: any): Promise<any | null> {
    const settings = this.settings.get(shopId)
    if (!settings) return null

    const updatedSettings = {
      ...settings,
      ...updates,
      updatedAt: new Date(),
    }

    this.settings.set(shopId, updatedSettings)
    return updatedSettings
  }

  // Health check
  async checkConnection(): Promise<{ isConnected: boolean; message: string }> {
    return { isConnected: true, message: "Mock database is always connected" }
  }
}

export const mockDb = MockDatabase.getInstance()
