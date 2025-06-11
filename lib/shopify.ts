// Enhanced Shopify security and API functions with Prisma integration
import { validateHmacSignature, encryptSensitiveData, decryptSensitiveData } from "./security"
import { SHOPIFY_CONFIG, SECURITY_CONFIG } from "./config"
import * as crypto from "crypto"
import prisma from "./prisma"

// Shopify API fetch function
export async function shopifyFetch(shopDomain: string, accessToken: string, endpoint: string): Promise<any> {
  const url = `https://${shopDomain}/admin/api/${SHOPIFY_CONFIG.API_VERSION}/${endpoint}`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Enhanced HMAC validation for both GET (OAuth) and POST (webhooks)
export function validateShopifyRequest(request: Request, secret: string): boolean {
  const url = new URL(request.url)
  const method = request.method.toUpperCase()

  if (method === "GET") {
    // OAuth callback validation
    return validateOAuthCallback(url, secret)
  } else if (method === "POST") {
    // Webhook validation (requires body)
    const hmac = request.headers.get("x-shopify-hmac-sha256")
    if (!hmac) return false

    // Note: Body validation needs to be done separately since we can't read it here
    return true // Will be validated in the route handler
  }

  return false
}

// Validate OAuth callback parameters
export function validateOAuthCallback(url: URL, secret: string): boolean {
  const params = url.searchParams
  const hmac = params.get("hmac")
  const shop = params.get("shop")

  if (!hmac || !shop) return false

  // Validate shop domain format
  if (!isValidShopDomain(shop)) return false

  // Create query string without hmac for validation
  const queryParams = new URLSearchParams()
  for (const [key, value] of params.entries()) {
    if (key !== "hmac" && key !== "signature") {
      queryParams.append(key, value)
    }
  }

  // Sort parameters and create query string
  const sortedParams = Array.from(queryParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&")

  // Validate HMAC
  const computedHmac = crypto.createHmac("sha256", secret).update(sortedParams).digest("hex")

  return crypto.timingSafeEqual(Buffer.from(hmac, "hex"), Buffer.from(computedHmac, "hex"))
}

// Validate webhook HMAC
export function validateWebhookHmac(body: string, hmac: string, secret: string): boolean {
  return validateHmacSignature(body, hmac, secret)
}

// Validate shop domain format
export function isValidShopDomain(shop: string): boolean {
  const shopDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/
  return shopDomainRegex.test(shop)
}

// Generate OAuth URL
export function generateOAuthUrl(shop: string, state: string): string {
  const params = new URLSearchParams({
    client_id: SHOPIFY_CONFIG.API_KEY,
    scope: SHOPIFY_CONFIG.SCOPES,
    redirect_uri: SHOPIFY_CONFIG.OAUTH_CALLBACK_URL,
    state,
    "grant_options[]": "per-user",
  })

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(
  shop: string,
  code: string,
): Promise<{
  access_token: string
  scope: string
}> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: SHOPIFY_CONFIG.API_KEY,
      client_secret: SHOPIFY_CONFIG.API_SECRET_KEY,
      code,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to exchange code for token: ${response.statusText}`)
  }

  return response.json()
}

// Generate secure state parameter
export function generateState(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Validate state parameter
export function validateState(receivedState: string, expectedState: string): boolean {
  return crypto.timingSafeEqual(Buffer.from(receivedState), Buffer.from(expectedState))
}

// Store encrypted access token in database
export async function storeEncryptedToken(shopDomain: string, encryptedToken: string): Promise<void> {
  try {
    await prisma.shopToken.upsert({
      where: { shopDomain },
      update: {
        encryptedToken,
        updatedAt: new Date(),
      },
      create: {
        shopDomain,
        encryptedToken,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  } catch (error) {
    console.error(`Failed to store token for ${shopDomain}:`, error)
    throw new Error(`Failed to store access token for shop: ${shopDomain}`)
  }
}

// Get encrypted token from database
export async function getEncryptedTokenForShop(shopDomain: string): Promise<string | null> {
  try {
    const tokenRecord = await prisma.shopToken.findUnique({
      where: { shopDomain },
    })

    return tokenRecord?.encryptedToken || null
  } catch (error) {
    console.error(`Failed to retrieve token for ${shopDomain}:`, error)
    return null
  }
}

// Encrypt and store access token
export async function securelyStoreAccessToken(shopDomain: string, accessToken: string): Promise<void> {
  const encryptedToken = secureStoreAccessToken(shopDomain, accessToken)
  await storeEncryptedToken(shopDomain, encryptedToken)
}

// Retrieve and decrypt access token
export async function securelyRetrieveAccessToken(shopDomain: string): Promise<string | null> {
  const encryptedToken = await getEncryptedTokenForShop(shopDomain)
  if (!encryptedToken) return null

  try {
    return secureRetrieveAccessToken(shopDomain, encryptedToken)
  } catch (error) {
    console.error(`Failed to decrypt token for ${shopDomain}:`, error)
    return null
  }
}

// Legacy functions for backward compatibility
export const validateWebhook = validateWebhookHmac

export const secureStoreAccessToken = (shopDomain: string, accessToken: string): string => {
  return encryptSensitiveData(accessToken, SECURITY_CONFIG.ENCRYPTION_KEY)
}

export const secureRetrieveAccessToken = (shopDomain: string, encryptedToken: string): string => {
  return decryptSensitiveData(encryptedToken, SECURITY_CONFIG.ENCRYPTION_KEY)
}

// Delete shop token from database
export async function deleteShopToken(shopDomain: string): Promise<boolean> {
  try {
    await prisma.shopToken.delete({
      where: { shopDomain },
    })
    return true
  } catch (error) {
    console.error(`Failed to delete token for ${shopDomain}:`, error)
    return false
  }
}

// Check if shop has valid token
export async function hasValidToken(shopDomain: string): Promise<boolean> {
  const token = await securelyRetrieveAccessToken(shopDomain)
  return !!token
}

// Validate Shopify requests with additional security checks
export const validateShopifyRequestLegacy = (request: Request): boolean => {
  // Check for required headers
  const shopDomain = request.headers.get("x-shopify-shop-domain")
  if (!shopDomain) return false

  // Validate shop domain format
  return isValidShopDomain(shopDomain)
}
