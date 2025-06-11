import { type NextRequest, NextResponse } from "next/server"
import { visualSearch } from "@/lib/visual-search"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Convert image to buffer
    const imageBuffer = Buffer.from(await image.arrayBuffer())

    // Perform visual search
    const results = await visualSearch.searchByImage(imageBuffer)

    return NextResponse.json({
      products: results.products,
      confidence: results.confidence,
      processingTime: results.processingTime,
      message: `Found ${results.products.length} similar products`,
    })
  } catch (error) {
    console.error("Visual search API error:", error)
    return NextResponse.json({ error: "Visual search failed" }, { status: 500 })
  }
}
