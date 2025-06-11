import { NextResponse } from "next/server"

// Mock data for third-party app integrations
const integrations = [
  {
    id: "checkout-plus",
    name: "Checkout Plus",
    description: "Enhanced checkout experience",
    status: "connected",
    features: ["One-click checkout", "Guest checkout", "Express payments"],
  },
  {
    id: "wishlist-plus",
    name: "Wishlist Plus",
    description: "Advanced wishlist functionality",
    status: "connected",
    features: ["Save for later", "Share wishlists", "Wishlist analytics"],
  },
  {
    id: "currency-converter",
    name: "Currency Converter",
    description: "Multi-currency support",
    status: "available",
    features: ["Real-time rates", "Auto-detection", "150+ currencies"],
  },
  {
    id: "product-labels",
    name: "Product Labels",
    description: "Custom product badges and labels",
    status: "available",
    features: ["Sale badges", "New arrival labels", "Custom text"],
  },
  {
    id: "reviews-app",
    name: "Reviews App",
    description: "Customer reviews and ratings",
    status: "connected",
    features: ["Star ratings", "Photo reviews", "Review moderation"],
  },
]

export async function GET() {
  return NextResponse.json({
    integrations,
    total: integrations.length,
    connected: integrations.filter((i) => i.status === "connected").length,
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { integrationId, action } = body

  // Handle integration connection/disconnection
  if (action === "connect") {
    return NextResponse.json({
      success: true,
      message: `Successfully connected to ${integrationId}`,
      timestamp: new Date().toISOString(),
    })
  }

  if (action === "disconnect") {
    return NextResponse.json({
      success: true,
      message: `Successfully disconnected from ${integrationId}`,
      timestamp: new Date().toISOString(),
    })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
