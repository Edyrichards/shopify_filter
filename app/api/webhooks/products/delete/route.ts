import { type NextRequest, NextResponse } from "next/server"
import { syncService } from "@/lib/sync-service"
import { validateWebhook } from "@/lib/shopify"
import { errorTracker, ErrorSeverity } from "@/lib/error-handler"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const hmac = request.headers.get("x-shopify-hmac-sha256")
    const shopDomain = request.headers.get("x-shopify-shop-domain")

    if (!hmac || !shopDomain) {
      errorTracker.trackError(new Error("Missing required headers"), ErrorSeverity.MEDIUM, {
        endpoint: "products/delete",
      })
      return NextResponse.json({ error: "Missing required headers" }, { status: 400 })
    }

    const isValid = validateWebhook(body, hmac, process.env.SHOPIFY_WEBHOOK_SECRET || "")
    if (!isValid) {
      errorTracker.trackError(new Error("Invalid webhook signature"), ErrorSeverity.HIGH, { shopDomain })
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 })
    }

    const productData = JSON.parse(body)

    // Process deletion immediately since it's a simple operation
    await syncService.processProductDeleteWebhook(shopDomain, productData)

    return NextResponse.json({ success: true, message: "Product deleted successfully" })
  } catch (error) {
    errorTracker.trackError(
      error instanceof Error ? error : new Error("Product delete webhook error"),
      ErrorSeverity.HIGH,
      { endpoint: "products/delete" },
    )
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
