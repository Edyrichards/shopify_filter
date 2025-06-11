import { type NextRequest, NextResponse } from "next/server"
import { syncService } from "@/lib/sync-service"
import { validateShopAuth, generateJobId, validateProductsSchema, chunkArray } from "@/lib/auth-helpers"
import { jobTracker } from "@/lib/job-tracker"
import { errorTracker, ErrorSeverity } from "@/lib/error-handler"
import { metrics } from "@/lib/metrics"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let jobId: string | null = null

  try {
    const { shopDomain, accessToken, products } = await request.json()

    // Validate authentication
    const authResult = await validateShopAuth(shopDomain, accessToken)
    if (!authResult.isValid) {
      errorTracker.trackError(new Error(`Auth validation failed: ${authResult.error}`), ErrorSeverity.MEDIUM, {
        shopDomain,
        endpoint: "sync/bulk",
      })
      return NextResponse.json({ error: authResult.error }, { status: 400 })
    }

    // Validate products schema
    const validationResult = validateProductsSchema(products)
    if (!validationResult.isValid) {
      errorTracker.trackError(new Error("Product validation failed"), ErrorSeverity.MEDIUM, {
        shopDomain: authResult.shopDomain,
        errors: validationResult.errors,
        invalidCount: validationResult.invalidProducts.length,
      })

      return NextResponse.json(
        {
          error: "Product validation failed",
          details: validationResult.errors,
          invalidProducts: validationResult.invalidProducts.map((item) => ({
            index: item.product.index,
            id: item.product.id,
            errors: item.errors,
          })),
        },
        { status: 400 },
      )
    }

    // Generate unique job ID
    jobId = generateJobId("bulk_sync")

    // Log job start with details
    console.log(
      `📦 Starting bulk sync job ${jobId} for ${authResult.shopDomain} with ${validationResult.validProducts.length} products`,
    )
    metrics.increment("sync.bulk.started", { shopDomain: authResult.shopDomain! })
    metrics.track("sync.bulk.products_count", validationResult.validProducts.length, {
      shopDomain: authResult.shopDomain!,
    })

    // Create job record
    const job = jobTracker.createJob(jobId, "bulk_sync", authResult.shopDomain!, {
      productCount: validationResult.validProducts.length,
      requestedAt: new Date().toISOString(),
      userAgent: request.headers.get("user-agent"),
    })

    // Start job
    jobTracker.startJob(jobId)

    // Chunk products in batches of 50 for better performance
    const productChunks = chunkArray(validationResult.validProducts, 50)
    console.log(`📊 Processing ${productChunks.length} batches of products (max 50 per batch)`)

    // Process products in background
    const processProducts = async () => {
      try {
        let processedCount = 0
        const totalProducts = validationResult.validProducts.length

        for (let i = 0; i < productChunks.length; i++) {
          const chunk = productChunks[i]
          console.log(`Processing batch ${i + 1}/${productChunks.length} (${chunk.length} products)`)

          await syncService.processBatchedProducts(authResult.shopDomain!, authResult.accessToken!, chunk)

          processedCount += chunk.length
          jobTracker.updateProgress(jobId!, processedCount, totalProducts)

          // Small delay between batches to prevent overwhelming the system
          if (i < productChunks.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }

        // Complete job
        const result = {
          processedProducts: processedCount,
          totalBatches: productChunks.length,
          completedAt: new Date().toISOString(),
        }

        jobTracker.completeJob(jobId!, result)
        metrics.increment("sync.bulk.completed", { shopDomain: authResult.shopDomain! })
        metrics.timing("sync.bulk.duration", startTime, { shopDomain: authResult.shopDomain! })

        console.log(`✅ Bulk sync job ${jobId} completed successfully`)
      } catch (error) {
        jobTracker.failJob(jobId!, error instanceof Error ? error.message : "Unknown error")
        errorTracker.trackError(error instanceof Error ? error : new Error("Bulk sync error"), ErrorSeverity.HIGH, {
          jobId,
          shopDomain: authResult.shopDomain,
        })
        metrics.increment("sync.bulk.failed", { shopDomain: authResult.shopDomain! })
      }
    }

    // Start processing in background
    processProducts()

    return NextResponse.json({
      success: true,
      message: `Bulk sync initiated for ${validationResult.validProducts.length} products`,
      jobId,
      shopDomain: authResult.shopDomain,
      productCount: validationResult.validProducts.length,
      batchCount: productChunks.length,
      timestamp: new Date().toISOString(),
      estimatedDuration: `${Math.ceil(productChunks.length * 0.5)}-${Math.ceil(productChunks.length * 1.5)} minutes`,
    })
  } catch (error) {
    if (jobId) {
      jobTracker.failJob(jobId, error instanceof Error ? error.message : "Unknown error")
    }

    errorTracker.trackError(
      error instanceof Error ? error : new Error("Bulk sync initiation error"),
      ErrorSeverity.HIGH,
      { jobId, endpoint: "sync/bulk" },
    )

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
