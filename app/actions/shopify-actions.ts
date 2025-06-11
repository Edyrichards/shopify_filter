"use server"

import { validateRequiredEnvVars } from "@/lib/config"

export async function getShopifyAdminUrl(shop: string) {
  // Validate required environment variables at runtime
  validateRequiredEnvVars(["SHOPIFY_API_KEY"])

  const apiKey = process.env.SHOPIFY_API_KEY

  return {
    url: `https://${shop}/admin/apps/${apiKey}`,
  }
}
