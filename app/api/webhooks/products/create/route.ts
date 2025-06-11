import { type NextRequest, NextResponse } from "next/server"
import { syncService } from "@/lib/sync-service"
import { validateWebhook, securelyRetrieveAccessToken } from "@/lib/shopify"
import { errorTracker, ErrorSeverity } from "@/lib/error-handler"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const hmac = request.headers.get("x-shopify-hmac-sha256")
    const shopDomain = request.headers.get("x-shopify-shop-domain")

    if (!hmac || !shopDomain) {
      errorTracker.trackError(new Error("Missing required headers"), ErrorSeverity.MEDIUM, {
        endpoint: "products/create",
      })
      return NextResponse.json({ error: "Missing required headers" }, { status: 400 })
    }

    // Validate webhook authenticity
    const isValid = validateWebhook(body, hmac, process.env.SHOPIFY_WEBHOOK_SECRET || "")
    if (!isValid) {
      errorTracker.trackError(new Error("Invalid webhook signature"), ErrorSeverity.HIGH, { shopDomain })
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 })
    }

    const productData = JSON.parse(body)

    // Get access token securely
    const accessToken = (await securelyRetrieveAccessToken(shopDomain)) || process.env.SHOPIFY_ACCESS_TOKEN || ""

    // Queue the job for processing
    const jobId = await syncService.queueProductSync(shopDomain, accessToken, productData)

    return NextResponse.json({
      success: true,
      message: "Product creation queued successfully",
      jobId,
    })
  } catch (error) {
    errorTracker.trackError(
      error instanceof Error ? error : new Error("Product create webhook error"),
      ErrorSeverity.HIGH,
      { endpoint: "products/create" },
    )
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
