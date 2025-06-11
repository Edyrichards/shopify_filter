import { db, type Product, type ProductVariant, type InventoryLevel, type SyncLog } from "./database"
import { shopifyFetch } from "./shopify"
import { chunk } from "./utils"
import { jobQueue } from "./queue"
import { metrics } from "./metrics"
import { safeExecute, ErrorSeverity } from "./error-handler"

export class SyncService {
  private static instance: SyncService
  private syncQueue: Map<string, any[]> = new Map()
  private isProcessing = false
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_TTL = 60 * 1000 // 1 minute

  // Add circuit breaker pattern
  private circuitState: "closed" | "open" | "half-open" = "closed"
  private failureCount = 0
  private readonly FAILURE_THRESHOLD = 5
  private readonly RESET_TIMEOUT = 30000 // 30 seconds
  private lastFailureTime = 0

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  constructor() {
    // Register workers for different job types
    jobQueue.registerWorker("product_sync", async (job) => {
      const { shopDomain, accessToken, productData } = job.data
      await this.processProductWebhook(shopDomain, accessToken, productData)
      return { success: true }
    })

    jobQueue.registerWorker("inventory_sync", async (job) => {
      const { shopDomain, accessToken, inventoryData } = job.data
      await this.processInventoryWebhook(shopDomain, accessToken, inventoryData)
      return { success: true }
    })

    jobQueue.registerWorker("full_sync", async (job) => {
      const { shopDomain, accessToken } = job.data
      await this.fullSync(shopDomain, accessToken)
      return { success: true }
    })
  }

  // Queue jobs instead of processing immediately
  async queueProductSync(shopDomain: string, accessToken: string, productData: any): Promise<string> {
    return jobQueue.addJob("product_sync", { shopDomain, accessToken, productData }, { priority: 1 })
  }

  async queueInventorySync(shopDomain: string, accessToken: string, inventoryData: any): Promise<string> {
    return jobQueue.addJob("inventory_sync", { shopDomain, accessToken, inventoryData }, { priority: 2 }) // Higher priority
  }

  async queueFullSync(shopDomain: string, accessToken: string): Promise<string> {
    return jobQueue.addJob("full_sync", { shopDomain, accessToken }, { priority: 0 }) // Lower priority
  }

  async processProductWebhook(shopDomain: string, accessToken: string, webhookData: any): Promise<void> {
    return safeExecute(
      async () => {
        const startTime = Date.now()
        const logId = `${Date.now()}-${Math.random()}`

        // Increment webhook counter
        metrics.increment("webhook.product.received", { shopDomain })

        await this.logSync(logId, shopDomain, "product_update", webhookData.id, "pending")

        const product = await this.transformShopifyProduct(webhookData, shopDomain)
        await db.saveProduct(product)

        // Sync variants
        for (const variantData of webhookData.variants || []) {
          const variant = await this.transformShopifyVariant(variantData, product.id)
          await db.saveVariant(variant)
        }

        await this.logSync(logId, shopDomain, "product_update", webhookData.id, "success")

        // Notify frontend of changes
        await this.notifyRealTimeUpdate(shopDomain, "product_updated", product)

        // Track success and timing
        metrics.increment("webhook.product.success", { shopDomain })
        metrics.timing("webhook.product.duration", startTime, { shopDomain })
      },
      `Failed to process product webhook for ${shopDomain}`,
      ErrorSeverity.HIGH,
      { productId: webhookData.id },
    )
  }

  async processInventoryWebhook(shopDomain: string, accessToken: string, webhookData: any): Promise<void> {
    return safeExecute(
      async () => {
        const logId = `${Date.now()}-${Math.random()}`

        await this.logSync(logId, shopDomain, "inventory_update", webhookData.inventory_item_id, "pending")

        const inventoryLevel: InventoryLevel = {
          id: `${webhookData.inventory_item_id}-${webhookData.location_id}`,
          shopifyInventoryItemId: webhookData.inventory_item_id,
          shopifyLocationId: webhookData.location_id,
          variantId: "", // Will be resolved from inventory item
          available: webhookData.available || 0,
          reserved: webhookData.reserved || 0,
          onHand: webhookData.on_hand || 0,
          committed: webhookData.committed || 0,
          incoming: webhookData.incoming || 0,
          updatedAt: new Date(),
        }

        await db.saveInventoryLevel(inventoryLevel)
        await this.logSync(logId, shopDomain, "inventory_update", webhookData.inventory_item_id, "success")

        // Notify frontend of inventory changes
        await this.notifyRealTimeUpdate(shopDomain, "inventory_updated", inventoryLevel)
      },
      `Failed to process inventory webhook for ${shopDomain}`,
      ErrorSeverity.HIGH,
      { inventoryItemId: webhookData.inventory_item_id },
    )
  }

  async processProductDeleteWebhook(shopDomain: string, webhookData: any): Promise<void> {
    return safeExecute(
      async () => {
        const logId = `${Date.now()}-${Math.random()}`

        await this.logSync(logId, shopDomain, "product_delete", webhookData.id, "pending")
        await db.deleteProduct(webhookData.id, shopDomain)
        await this.logSync(logId, shopDomain, "product_delete", webhookData.id, "success")

        // Notify frontend of deletion
        await this.notifyRealTimeUpdate(shopDomain, "product_deleted", { id: webhookData.id })
      },
      `Failed to process product delete webhook for ${shopDomain}`,
      ErrorSeverity.HIGH,
      { productId: webhookData.id },
    )
  }

  async fullSync(shopDomain: string, accessToken: string): Promise<void> {
    const startTime = Date.now()
    try {
      metrics.increment("sync.full.started", { shopDomain })
      console.log(`Starting full sync for ${shopDomain}`)

      let hasNextPage = true
      let pageInfo = null
      let syncedCount = 0

      while (hasNextPage) {
        const query = pageInfo ? `products.json?limit=250&page_info=${pageInfo}` : "products.json?limit=250"

        const response = await shopifyFetch(shopDomain, accessToken, query)

        for (const productData of response.products) {
          await this.processProductWebhook(shopDomain, accessToken, productData)
          syncedCount++
        }

        hasNextPage = response.products.length === 250
        pageInfo = response.products.length > 0 ? response.products[response.products.length - 1].id : null
      }

      console.log(`Full sync completed for ${shopDomain}. Synced ${syncedCount} products.`)

      metrics.increment("sync.full.completed", { shopDomain })
      metrics.timing("sync.full.duration", startTime, { shopDomain })
      metrics.track("sync.full.products_count", syncedCount, { shopDomain })

      // Notify frontend of sync completion
      await this.notifyRealTimeUpdate(shopDomain, "full_sync_completed", { syncedCount })
    } catch (error) {
      metrics.increment("sync.full.error", {
        shopDomain,
        errorType: error.name || "Unknown",
      })
      console.error(`Full sync failed for ${shopDomain}:`, error)
      throw error
    }
  }

  // Add batch processing for better performance
  async processBatchedProducts(shopDomain: string, accessToken: string, products: any[]): Promise<void> {
    console.log(`Processing batch of ${products.length} products for ${shopDomain}`)

    // Process in parallel with concurrency limit
    const batchSize = 10
    const batches = chunk(products, batchSize)

    for (const batch of batches) {
      await Promise.all(
        batch.map((product) =>
          this.processProductWebhook(shopDomain, accessToken, product).catch((error) => {
            console.error(`Error processing product ${product.id}:`, error)
            return this.logSync(
              `error-${Date.now()}-${product.id}`,
              shopDomain,
              "product_update",
              product.id,
              "error",
              error.message,
            )
          }),
        ),
      )
    }
  }

  // Add incremental sync capability
  async incrementalSync(shopDomain: string, accessToken: string, updatedAtMin: string): Promise<void> {
    try {
      console.log(`Starting incremental sync for ${shopDomain} since ${updatedAtMin}`)

      // Fetch only products updated since the specified date
      const query = `products.json?limit=250&updated_at_min=${updatedAtMin}`
      const response = await shopifyFetch(shopDomain, accessToken, query)

      if (response.products && response.products.length > 0) {
        await this.processBatchedProducts(shopDomain, accessToken, response.products)
        console.log(`Incremental sync completed for ${shopDomain}. Synced ${response.products.length} products.`)
      } else {
        console.log(`No products updated since ${updatedAtMin}`)
      }

      // Notify frontend of sync completion
      await this.notifyRealTimeUpdate(shopDomain, "incremental_sync_completed", {
        syncedCount: response.products?.length || 0,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error(`Incremental sync failed for ${shopDomain}:`, error)
      throw error
    }
  }

  private async transformShopifyProduct(shopifyProduct: any, shopDomain: string): Promise<Product> {
    return {
      id: `${shopDomain}-${shopifyProduct.id}`,
      shopifyId: shopifyProduct.id.toString(),
      shopDomain,
      title: shopifyProduct.title,
      handle: shopifyProduct.handle,
      description: shopifyProduct.body_html || "",
      vendor: shopifyProduct.vendor || "",
      productType: shopifyProduct.product_type || "",
      tags: shopifyProduct.tags ? shopifyProduct.tags.split(",").map((tag) => tag.trim()) : [],
      status: shopifyProduct.status,
      createdAt: new Date(shopifyProduct.created_at),
      updatedAt: new Date(shopifyProduct.updated_at),
      publishedAt: shopifyProduct.published_at ? new Date(shopifyProduct.published_at) : undefined,
      images:
        shopifyProduct.images?.map((img: any, index: number) => ({
          id: `${shopDomain}-${img.id}`,
          shopifyId: img.id.toString(),
          productId: `${shopDomain}-${shopifyProduct.id}`,
          src: img.src,
          alt: img.alt,
          position: img.position || index + 1,
          width: img.width || 0,
          height: img.height || 0,
          createdAt: new Date(img.created_at),
          updatedAt: new Date(img.updated_at),
        })) || [],
      variants: [], // Will be populated separately
      metafields: [], // Will be populated separately
      seo: {
        title: shopifyProduct.seo_title,
        description: shopifyProduct.seo_description,
      },
    }
  }

  private async transformShopifyVariant(shopifyVariant: any, productId: string): Promise<ProductVariant> {
    return {
      id: `variant-${shopifyVariant.id}`,
      shopifyId: shopifyVariant.id.toString(),
      productId,
      title: shopifyVariant.title,
      price: Number.parseFloat(shopifyVariant.price),
      compareAtPrice: shopifyVariant.compare_at_price ? Number.parseFloat(shopifyVariant.compare_at_price) : undefined,
      sku: shopifyVariant.sku,
      barcode: shopifyVariant.barcode,
      inventoryQuantity: shopifyVariant.inventory_quantity || 0,
      inventoryPolicy: shopifyVariant.inventory_policy || "deny",
      inventoryManagement: shopifyVariant.inventory_management || "not_managed",
      weight: shopifyVariant.weight || 0,
      weightUnit: shopifyVariant.weight_unit || "kg",
      position: shopifyVariant.position || 1,
      option1: shopifyVariant.option1,
      option2: shopifyVariant.option2,
      option3: shopifyVariant.option3,
      createdAt: new Date(shopifyVariant.created_at),
      updatedAt: new Date(shopifyVariant.updated_at),
    }
  }

  private async logSync(
    id: string,
    shopDomain: string,
    eventType: string,
    shopifyId: string,
    status: "success" | "error" | "pending",
    errorMessage?: string,
  ): Promise<void> {
    const log: SyncLog = {
      id,
      shopDomain,
      eventType,
      shopifyId,
      status,
      errorMessage,
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.saveSyncLog(log)
  }

  private async notifyRealTimeUpdate(shopDomain: string, eventType: string, data: any): Promise<void> {
    // This would integrate with WebSocket or Server-Sent Events
    // For now, we'll use a simple event emitter pattern
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("shopify-sync-update", {
          detail: { shopDomain, eventType, data, timestamp: new Date() },
        }),
      )
    }
  }

  async getCachedProduct(shopDomain: string, productId: string): Promise<Product | null> {
    const cacheKey = `${shopDomain}-product-${productId}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    const product = await db.getProduct(productId, shopDomain)

    if (product) {
      this.cache.set(cacheKey, {
        data: product,
        timestamp: Date.now(),
      })
    }

    return product
  }

  invalidateCache(shopDomain: string, productId: string): void {
    const cacheKey = `${shopDomain}-product-${productId}`
    this.cache.delete(cacheKey)
  }

  async executeWithCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.circuitState === "open") {
      // Check if we should try to reset
      if (Date.now() - this.lastFailureTime > this.RESET_TIMEOUT) {
        this.circuitState = "half-open"
        console.log("Circuit breaker state changed to half-open")
      } else {
        throw new Error("Circuit breaker is open")
      }
    }

    try {
      const result = await operation()

      // Success - reset failure count and close circuit if half-open
      if (this.circuitState === "half-open") {
        this.circuitState = "closed"
        this.failureCount = 0
        console.log("Circuit breaker state changed to closed")
      }

      return result
    } catch (error) {
      // Failure - increment count and check threshold
      this.failureCount++
      this.lastFailureTime = Date.now()

      if (this.failureCount >= this.FAILURE_THRESHOLD) {
        this.circuitState = "open"
        console.log("Circuit breaker state changed to open")
      }

      throw error
    }
  }
}

export const syncService = SyncService.getInstance()
