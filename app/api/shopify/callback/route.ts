import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { validateOAuthCallback, exchangeCodeForToken, isValidShopDomain } from "@/lib/shopify"
import { shopService } from "@/lib/database/shop-service"
import { errorTracker, ErrorSeverity } from "@/lib/error-handler"
import { syncService } from "@/lib/sync-service"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const params = url.searchParams

    const code = params.get("code")
    const shop = params.get("shop")
    const state = params.get("state")
    const hmac = params.get("hmac")

    // Validate required parameters
    if (!code || !shop || !state || !hmac) {
      errorTracker.trackError(new Error("Missing required OAuth parameters"), ErrorSeverity.MEDIUM, {
        code: !!code,
        shop: !!shop,
        state: !!state,
        hmac: !!hmac,
      })
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Validate shop domain
    if (!isValidShopDomain(shop)) {
      errorTracker.trackError(new Error("Invalid shop domain in OAuth callback"), ErrorSeverity.MEDIUM, { shop })
      return NextResponse.json({ error: "Invalid shop domain" }, { status: 400 })
    }

    // Validate HMAC signature
    const isValidHmac = validateOAuthCallback(url, process.env.SHOPIFY_API_SECRET_KEY!)
    if (!isValidHmac) {
      errorTracker.trackError(new Error("Invalid HMAC signature in OAuth callback"), ErrorSeverity.HIGH, { shop, hmac })
      return NextResponse.json({ error: "Invalid request signature" }, { status: 401 })
    }

    // Find and validate install session
    const sessions = await shopService.getInstallSession(state)
    if (!sessions) {
      errorTracker.trackError(new Error("Invalid or expired install session"), ErrorSeverity.MEDIUM, { shop, state })
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 400 })
    }

    // Validate state matches session
    if (sessions.shopDomain !== shop) {
      errorTracker.trackError(new Error("Shop domain mismatch in OAuth callback"), ErrorSeverity.HIGH, {
        sessionShop: sessions.shopDomain,
        callbackShop: shop,
      })
      return NextResponse.json({ error: "Invalid session" }, { status: 400 })
    }

    // Exchange authorization code for access token
    const tokenData = await exchangeCodeForToken(shop, code)

    // Create or update shop record
    const existingShop = await shopService.getShopByDomain(shop)

    if (existingShop) {
      // Update existing shop
      await shopService.updateShop(shop, {
        accessToken: tokenData.access_token, // Will be encrypted in service
        scope: tokenData.scope,
        isActive: true,
      })
    } else {
      // Create new shop
      await shopService.createShop({
        shopDomain: shop,
        accessToken: tokenData.access_token, // Will be encrypted in service
        scope: tokenData.scope,
        isActive: true,
        settings: {} as any,
        products: [],
        syncLogs: [],
      })
    }

    // Mark install session as completed
    await shopService.completeInstallSession(state)

    // Start initial sync in background
    const accessToken = await shopService.getDecryptedAccessToken(shop)
    if (accessToken) {
      syncService.queueFullSync(shop, accessToken).catch((error) => {
        errorTracker.trackError(error, ErrorSeverity.MEDIUM, { shop, context: "initial_sync" })
      })
    }

    // Redirect to app success page or Shopify admin
    const redirectUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    errorTracker.trackError(
      error instanceof Error ? error : new Error("OAuth callback error"),
      ErrorSeverity.CRITICAL,
      { endpoint: "shopify/callback" },
    )

    // Redirect to error page
    return NextResponse.redirect(`${process.env.HOST}/install/error?message=installation_failed`)
  }
}
