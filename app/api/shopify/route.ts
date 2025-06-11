import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { generateOAuthUrl, generateState, isValidShopDomain } from "@/lib/shopify"
import { shopService } from "@/lib/database/shop-service"
import { errorTracker, ErrorSeverity } from "@/lib/error-handler"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shop = searchParams.get("shop")

    if (!shop) {
      return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 })
    }

    // Validate shop domain format
    if (!isValidShopDomain(shop)) {
      errorTracker.trackError(new Error("Invalid shop domain format"), ErrorSeverity.MEDIUM, { shop })
      return NextResponse.json({ error: "Invalid shop domain" }, { status: 400 })
    }

    // Check if shop is already installed
    const existingShop = await shopService.getShopByDomain(shop)
    if (existingShop && existingShop.isActive) {
      // Shop already installed, redirect to app
      return NextResponse.redirect(`https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`)
    }

    // Generate secure state parameter
    const state = generateState()

    // Create install session
    await shopService.createInstallSession({
      shopDomain: shop,
      state,
      hmac: "", // Will be validated in callback
      timestamp: Date.now().toString(),
      isCompleted: false,
    })

    // Generate OAuth URL
    const oauthUrl = generateOAuthUrl(shop, state)

    // Redirect to Shopify OAuth
    return NextResponse.redirect(oauthUrl)
  } catch (error) {
    errorTracker.trackError(error instanceof Error ? error : new Error("OAuth initiation error"), ErrorSeverity.HIGH, {
      endpoint: "shopify/oauth",
    })
    return NextResponse.json({ error: "Failed to initiate OAuth" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shop, action } = body

    if (!shop) {
      return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 })
    }

    if (!isValidShopDomain(shop)) {
      return NextResponse.json({ error: "Invalid shop domain" }, { status: 400 })
    }

    switch (action) {
      case "check_installation":
        const existingShop = await shopService.getShopByDomain(shop)
        return NextResponse.json({
          installed: !!existingShop?.isActive,
          shop: existingShop
            ? {
                domain: existingShop.shopDomain,
                installedAt: existingShop.installedAt,
                scope: existingShop.scope,
              }
            : null,
        })

      case "uninstall":
        const success = await shopService.deactivateShop(shop)
        return NextResponse.json({
          success,
          message: success ? "Shop uninstalled successfully" : "Shop not found",
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    errorTracker.trackError(error instanceof Error ? error : new Error("Shopify API error"), ErrorSeverity.HIGH)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
