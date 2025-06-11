import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { parseDateRange } from "@/lib/auth-helpers"
import { errorTracker, ErrorSeverity } from "@/lib/error-handler"

// Enhanced analytics data structure
interface AnalyticsResponse {
  filtersUsed: {
    category: { name: string; usage: number; conversionRate: number }[]
    priceRange: { range: string; usage: number; conversionRate: number }[]
    tags: { name: string; usage: number; conversionRate: number }[]
    overall: {
      withFilters: number
      withoutFilters: number
      conversionImprovement: number
    }
  }
  searchTrends: {
    date: string
    searches: number
    conversions: number
    conversionRate: number
  }[]
  topSearches: {
    term: string
    count: number
    conversions: number
    conversionRate: number
    trend: "up" | "down" | "stable"
  }[]
  noResults: {
    term: string
    count: number
    lastSeen: string
    suggestedActions: string[]
  }[]
  summary: {
    totalSearches: number
    totalConversions: number
    averageConversionRate: number
    filterUsageRate: number
    topPerformingFilter: string
    improvementOpportunities: string[]
    dateRange: {
      from: string
      to: string
    }
  }
}

// Mock function to generate analytics data based on date range
function generateAnalyticsData(from: Date, to: Date): AnalyticsResponse {
  const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))

  // Generate search trends for the date range
  const searchTrends = []
  for (let i = 0; i < daysDiff; i++) {
    const date = new Date(from.getTime() + i * 24 * 60 * 60 * 1000)
    const baseSearches = 200 + Math.floor(Math.random() * 100)
    const conversions = Math.floor(baseSearches * (0.08 + Math.random() * 0.04))

    searchTrends.push({
      date: date.toISOString().split("T")[0],
      searches: baseSearches,
      conversions,
      conversionRate: Number((conversions / baseSearches).toFixed(3)),
    })
  }

  const totalSearches = searchTrends.reduce((sum, day) => sum + day.searches, 0)
  const totalConversions = searchTrends.reduce((sum, day) => sum + day.conversions, 0)

  return {
    filtersUsed: {
      category: [
        { name: "Clothing", usage: 68, conversionRate: 12.4 },
        { name: "Shoes", usage: 45, conversionRate: 9.8 },
        { name: "Accessories", usage: 32, conversionRate: 15.2 },
        { name: "Electronics", usage: 28, conversionRate: 7.6 },
      ],
      priceRange: [
        { range: "$0-$25", usage: 42, conversionRate: 8.9 },
        { range: "$25-$50", usage: 38, conversionRate: 11.2 },
        { range: "$50-$100", usage: 35, conversionRate: 13.7 },
        { range: "$100+", usage: 22, conversionRate: 16.8 },
      ],
      tags: [
        { name: "bestseller", usage: 55, conversionRate: 18.3 },
        { name: "new", usage: 48, conversionRate: 14.7 },
        { name: "sale", usage: 41, conversionRate: 22.1 },
        { name: "premium", usage: 29, conversionRate: 19.4 },
        { name: "eco-friendly", usage: 18, conversionRate: 16.2 },
      ],
      overall: {
        withFilters: 1923,
        withoutFilters: 924,
        conversionImprovement: 141,
      },
    },
    searchTrends,
    topSearches: [
      { term: "t-shirt", count: 245, conversions: 29, conversionRate: 0.118, trend: "up" },
      { term: "shoes", count: 189, conversions: 17, conversionRate: 0.09, trend: "stable" },
      { term: "jacket", count: 132, conversions: 9, conversionRate: 0.068, trend: "down" },
      { term: "dress", count: 98, conversions: 11, conversionRate: 0.112, trend: "up" },
      { term: "jeans", count: 87, conversions: 7, conversionRate: 0.08, trend: "stable" },
      { term: "sneakers", count: 76, conversions: 8, conversionRate: 0.105, trend: "up" },
      { term: "bag", count: 65, conversions: 12, conversionRate: 0.185, trend: "up" },
    ],
    noResults: [
      {
        term: "winter boots",
        count: 23,
        lastSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        suggestedActions: ["Add winter boot products", "Create synonym mapping", "Add to search suggestions"],
      },
      {
        term: "sunglasses",
        count: 18,
        lastSeen: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        suggestedActions: ["Expand accessories category", "Partner with eyewear brands"],
      },
      {
        term: "swimwear",
        count: 12,
        lastSeen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        suggestedActions: ["Add seasonal products", "Create summer collection"],
      },
      {
        term: "formal wear",
        count: 9,
        lastSeen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        suggestedActions: ["Add formal clothing line", "Create dress code guide"],
      },
    ],
    summary: {
      totalSearches,
      totalConversions,
      averageConversionRate: Number((totalConversions / totalSearches).toFixed(3)),
      filterUsageRate: 67.5,
      topPerformingFilter: "sale tag",
      improvementOpportunities: [
        "Add products for high-volume no-result searches",
        "Improve conversion rate for electronics category",
        "Optimize price range filters for better discovery",
        "Create seasonal product collections",
      ],
      dateRange: {
        from: from.toISOString().split("T")[0],
        to: to.toISOString().split("T")[0],
      },
    },
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")
    const shopDomain = searchParams.get("shopDomain")

    // Parse date range with defaults
    const { from, to } = parseDateRange(fromParam, toParam)

    // Validate date range
    const maxDays = 90
    const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff > maxDays) {
      return NextResponse.json(
        {
          error: `Date range too large. Maximum ${maxDays} days allowed.`,
          maxDays,
          requestedDays: daysDiff,
        },
        { status: 400 },
      )
    }

    // Log analytics request
    console.log(
      `📊 Analytics request: ${from.toISOString().split("T")[0]} to ${to.toISOString().split("T")[0]}${shopDomain ? ` for ${shopDomain}` : ""}`,
    )

    // Generate analytics data
    const analyticsData = generateAnalyticsData(from, to)

    // Add metadata
    const response = {
      ...analyticsData,
      metadata: {
        generatedAt: new Date().toISOString(),
        shopDomain: shopDomain || "all",
        requestedRange: {
          from: from.toISOString(),
          to: to.toISOString(),
          days: daysDiff,
        },
        dataSource: "mock", // In production: "database" | "cache" | "realtime"
        version: "1.0",
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    errorTracker.trackError(error instanceof Error ? error : new Error("Analytics API error"), ErrorSeverity.MEDIUM, {
      endpoint: "analytics",
    })

    return NextResponse.json(
      {
        error: "Failed to generate analytics data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, data, shopDomain } = body

    // Log analytics event for future processing
    console.log(`📈 Analytics event: ${event}`, { shopDomain, data })

    // In production, this would save to a database or analytics service
    // For now, we'll just acknowledge the event

    const supportedEvents = [
      "search_performed",
      "filter_applied",
      "product_clicked",
      "conversion_tracked",
      "no_results_found",
    ]

    if (!supportedEvents.includes(event)) {
      return NextResponse.json({ error: "Unsupported event type" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Analytics event recorded",
      event,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    errorTracker.trackError(error instanceof Error ? error : new Error("Analytics event error"), ErrorSeverity.LOW, {
      endpoint: "analytics/event",
    })

    return NextResponse.json({ error: "Failed to record analytics event" }, { status: 500 })
  }
}
