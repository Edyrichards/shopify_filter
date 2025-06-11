import { type NextRequest, NextResponse } from "next/server"
import { typesenseClient, isTypesenseEnabled } from "@/lib/typesense"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const suggestions = await generateSuggestions(query)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Suggestions API error:", error)
    return NextResponse.json({ error: "Failed to get suggestions" }, { status: 500 })
  }
}

async function generateSuggestions(query: string) {
  const suggestions: Array<{
    text: string
    type: "query" | "product" | "category"
    count?: number
  }> = []

  try {
    // Get query suggestions from search history
    const queryHistory = await prisma.searchAnalytics.findMany({
      where: {
        query: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        query: true,
        _count: {
          select: { id: true },
        },
      },
      groupBy: ["query"],
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    })

    queryHistory.forEach((item) => {
      suggestions.push({
        text: item.query,
        type: "query",
        count: item._count.id,
      })
    })

    // Get product suggestions if Typesense is enabled
    if (isTypesenseEnabled()) {
      try {
        const productResults = await typesenseClient.collections("products").documents().search({
          q: query,
          query_by: "title,description,tags",
          per_page: 5,
          sort_by: "_text_match:desc",
        })

        productResults.hits?.forEach((hit: any) => {
          suggestions.push({
            text: hit.document.title,
            type: "product",
          })
        })
      } catch (error) {
        console.error("Typesense suggestion error:", error)
      }
    }

    // Get category suggestions
    const categories = await prisma.product.findMany({
      where: {
        OR: [{ category: { contains: query, mode: "insensitive" } }, { tags: { has: query } }],
      },
      select: {
        category: true,
      },
      distinct: ["category"],
      take: 3,
    })

    categories.forEach((item) => {
      if (item.category) {
        suggestions.push({
          text: item.category,
          type: "category",
        })
      }
    })

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => index === self.findIndex((s) => s.text === suggestion.text))
      .slice(0, 8)

    return uniqueSuggestions
  } catch (error) {
    console.error("Error generating suggestions:", error)
    return []
  }
}
