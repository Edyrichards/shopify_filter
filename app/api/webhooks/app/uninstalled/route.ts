import { type NextRequest, NextResponse } from "next/server"
import { validateWebhookHmac } from "@/lib/shopify"
import { shopService } from "@/lib/database/shop-service"
import { errorTracker, ErrorSeverity } from "@/lib/error-handler"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const hmac = request.headers.get("x-shopify-hmac-sha256")
    const shopDomain = request.headers.get("x-shopify-shop-domain")

    if (!hmac || !shopDomain) {
      errorTracker.trackError(new Error("Missing required headers"), ErrorSeverity.MEDIUM, {
        endpoint: "app/uninstalled",
      })
      return NextResponse.json({ error: "Missing required headers" }, { status: 400 })
    }

    // Validate webhook signature
    const isValid = validateWebhookHmac(body, hmac, process.env.SHOPIFY_WEBHOOK_SECRET || "")
    if (!isValid) {
      errorTracker.trackError(new Error("Invalid webhook signature"), ErrorSeverity.HIGH, {
        shopDomain,
        endpoint: "app/uninstalled",
      })
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 })
    }

    // Parse webhook data
    const uninstallData = JSON.parse(body)

    // Deactivate shop
    const success = await shopService.deactivateShop(shopDomain)

    if (success) {
      console.log(`App uninstalled for shop: ${shopDomain}`)

      // Log the uninstall event
      errorTracker.trackError(new Error("App uninstalled"), ErrorSeverity.LOW, {
        shopDomain,
        uninstallData,
        context: "app_uninstalled",
      })
    }

    return NextResponse.json({
      success,
      message: success ? "App uninstalled successfully" : "Shop not found",
    })
  } catch (error) {
    errorTracker.trackError(
      error instanceof Error ? error : new Error("App uninstall webhook error"),
      ErrorSeverity.HIGH,
      { endpoint: "app/uninstalled" },
    )
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
