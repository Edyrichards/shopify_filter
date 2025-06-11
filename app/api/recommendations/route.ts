import { type NextRequest, NextResponse } from "next/server"
import { aiRecommendations } from "@/lib/ai-recommendations"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId") || "anonymous"
    const userId = searchParams.get("userId")
    const currentProduct = searchParams.get("currentProduct")
    const strategy = (searchParams.get("strategy") as "collaborative" | "content" | "hybrid" | "trending") || "hybrid"
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    // Build recommendation context
    const context = {
      userId,
      sessionId,
      currentProduct: currentProduct || undefined,
      // In production, you'd gather more context from user session/cookies
      searchHistory: [],
      viewHistory: [],
      cartItems: [],
    }

    const recommendations = await aiRecommendations.getRecommendations(context, {
      limit,
      strategy,
      excludeIds: currentProduct ? [currentProduct] : [],
    })

    return NextResponse.json({
      recommendations: recommendations.products,
      strategy: recommendations.strategy,
      confidence: recommendations.confidence,
    })
  } catch (error) {
    console.error("Recommendations API error:", error)
    return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sessionId, productId, interactionType, context } = body

    if (!sessionId || !productId || !interactionType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await aiRecommendations.recordInteraction(userId, sessionId, productId, interactionType, context)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Interaction recording error:", error)
    return NextResponse.json({ error: "Failed to record interaction" }, { status: 500 })
  }
}
