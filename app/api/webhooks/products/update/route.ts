import { type NextRequest, NextResponse } from "next/server"
import { syncService } from "@/lib/sync-service"
import { validateWebhook, securelyRetrieveAccessToken } from "@/lib/shopify"
import { errorTracker, ErrorSeverity } from "@/lib/error-handler"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting is handled by middleware

    const body = await request.text()
    const hmac = request.headers.get("x-shopify-hmac-sha256")
    const shopDomain = request.headers.get("x-shopify-shop-domain")
    const shopifyApiVersion = request.headers.get("x-shopify-api-version")

    // Enhanced validation
    if (!hmac || !shopDomain) {
      errorTracker.trackError(new Error("Missing required headers"), ErrorSeverity.MEDIUM, {
        headers: Object.fromEntries(request.headers.entries()),
      })
      return NextResponse.json({ error: "Missing required headers" }, { status: 400 })
    }

    // Validate webhook signature with enhanced security
    const isValid = validateWebhook(body, hmac, process.env.SHOPIFY_WEBHOOK_SECRET || "")
    if (!isValid) {
      errorTracker.trackError(new Error("Invalid webhook signature"), ErrorSeverity.HIGH, { shopDomain })
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 })
    }

    // Validate JSON format before processing
    let productData
    try {
      productData = JSON.parse(body)
    } catch (e) {
      errorTracker.trackError(new Error("Invalid JSON payload"), ErrorSeverity.MEDIUM, { shopDomain })
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    // Validate required fields
    if (!productData.id) {
      errorTracker.trackError(new Error("Missing product ID"), ErrorSeverity.MEDIUM, { shopDomain })
      return NextResponse.json({ error: "Missing product ID" }, { status: 400 })
    }

    // Get access token securely
    const accessToken = (await securelyRetrieveAccessToken(shopDomain)) || process.env.SHOPIFY_ACCESS_TOKEN || ""

    // Queue the job instead of processing immediately
    const jobId = await syncService.queueProductSync(shopDomain, accessToken, productData)

    return NextResponse.json({
      success: true,
      message: "Product update queued successfully",
      jobId,
    })
  } catch (error) {
    errorTracker.trackError(
      error instanceof Error ? error : new Error("Product update webhook error"),
      ErrorSeverity.HIGH,
    )
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
