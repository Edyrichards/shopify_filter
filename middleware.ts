import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { RateLimiter } from "./lib/rate-limiter"
import { SECURITY_CONFIG, RATE_LIMIT_CONFIG } from "./lib/constants"
import { errorTracker, ErrorSeverity } from "./lib/error-handler"

// Create rate limiters for different endpoints
const apiLimiter = new RateLimiter(RATE_LIMIT_CONFIG.API)
const webhookLimiter = new RateLimiter(RATE_LIMIT_CONFIG.WEBHOOKS)
const oauthLimiter = new RateLimiter(RATE_LIMIT_CONFIG.OAUTH)
const installLimiter = new RateLimiter(RATE_LIMIT_CONFIG.INSTALL)

// Start cleanup to prevent memory leaks
apiLimiter.startCleanup()
webhookLimiter.startCleanup()
oauthLimiter.startCleanup()
installLimiter.startCleanup()

function getClientInfo(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"
  const shopDomain =
    request.headers.get("x-shopify-shop-domain") || request.nextUrl.searchParams.get("shop") || "unknown"

  return { ip, userAgent, shopDomain }
}

function logRateLimitViolation(path: string, clientInfo: any, remaining: number) {
  errorTracker.trackError(new Error(`Rate limit exceeded for ${path}`), ErrorSeverity.MEDIUM, {
    path,
    ip: clientInfo.ip,
    shopDomain: clientInfo.shopDomain,
    userAgent: clientInfo.userAgent,
    remaining,
  })

  console.warn(`Rate limit exceeded: ${path}`, {
    ip: clientInfo.ip,
    shop: clientInfo.shopDomain,
    remaining,
  })
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const response = NextResponse.next()
  const clientInfo = getClientInfo(request)

  // Add security headers
  const headers = response.headers

  // Set security headers from constants
  Object.entries(SECURITY_CONFIG.HEADERS).forEach(([key, value]) => {
    headers.set(key, value)
  })

  // Set CSP header
  headers.set("Content-Security-Policy", SECURITY_CONFIG.CSP)

  // Apply rate limiting based on path
  let limiter: RateLimiter
  let limitType: string

  if (path.startsWith("/api/shopify") && !path.includes("/webhooks/")) {
    limiter = oauthLimiter
    limitType = "OAuth"
  } else if (path.includes("/install") || path === "/api/shopify") {
    limiter = installLimiter
    limitType = "Install"
  } else if (path.startsWith("/api/webhooks/")) {
    limiter = webhookLimiter
    limitType = "Webhook"
  } else if (path.startsWith("/api/")) {
    limiter = apiLimiter
    limitType = "API"
  } else {
    // No rate limiting for static content
    return NextResponse.next({ headers })
  }

  const result = await limiter.limit(request)

  // Set rate limit headers
  headers.set("X-RateLimit-Limit", limiter.maxRequests.toString())
  headers.set("X-RateLimit-Remaining", result.remaining.toString())
  headers.set("X-RateLimit-Reset", (result.resetTime / 1000).toString())
  headers.set("X-RateLimit-Type", limitType)

  if (result.limited) {
    logRateLimitViolation(path, clientInfo, result.remaining)

    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        ...Object.fromEntries(headers.entries()),
        "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
      },
    })
  }

  // Enhanced validation for Shopify endpoints
  if (path.startsWith("/api/shopify") || path.startsWith("/api/webhooks/")) {
    // For OAuth endpoints, validate shop parameter
    if (path.startsWith("/api/shopify") && !path.includes("/webhooks/")) {
      const shop = request.nextUrl.searchParams.get("shop")
      if (shop && !/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop)) {
        errorTracker.trackError(new Error("Invalid shop domain format"), ErrorSeverity.MEDIUM, {
          shop,
          ip: clientInfo.ip,
        })
        return new NextResponse("Invalid shop domain", {
          status: 400,
          headers,
        })
      }
    }

    // For webhook endpoints, basic validation (detailed validation in route handlers)
    if (path.startsWith("/api/webhooks/")) {
      const shopDomain = request.headers.get("x-shopify-shop-domain")
      if (!shopDomain) {
        errorTracker.trackError(new Error("Missing shop domain header"), ErrorSeverity.MEDIUM, {
          path,
          ip: clientInfo.ip,
        })
        return new NextResponse("Missing shop domain", {
          status: 400,
          headers,
        })
      }
    }
  }

  return NextResponse.next({ headers })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)", "/api/:path*"],
}
