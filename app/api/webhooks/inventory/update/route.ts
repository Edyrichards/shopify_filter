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
        endpoint: "inventory/update",
      })
      return NextResponse.json({ error: "Missing required headers" }, { status: 400 })
    }

    const isValid = validateWebhook(body, hmac, process.env.SHOPIFY_WEBHOOK_SECRET || "")
    if (!isValid) {
      errorTracker.trackError(new Error("Invalid webhook signature"), ErrorSeverity.HIGH, { shopDomain })
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 })
    }

    const inventoryData = JSON.parse(body)

    // Get access token securely
    const accessToken = (await securelyRetrieveAccessToken(shopDomain)) || process.env.SHOPIFY_ACCESS_TOKEN || ""

    // Queue inventory update with high priority
    const jobId = await syncService.queueInventorySync(shopDomain, accessToken, inventoryData)

    return NextResponse.json({
      success: true,
      message: "Inventory update queued successfully",
      jobId,
    })
  } catch (error) {
    errorTracker.trackError(
      error instanceof Error ? error : new Error("Inventory update webhook error"),
      ErrorSeverity.HIGH,
      { endpoint: "inventory/update" },
    )
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
