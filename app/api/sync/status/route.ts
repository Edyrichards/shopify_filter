import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shopDomain = searchParams.get("shopDomain")

    if (!shopDomain) {
      return NextResponse.json({ error: "Missing shopDomain parameter" }, { status: 400 })
    }

    const syncLogs = await db.getSyncLogs(shopDomain, 100)
    const products = await db.getProductsByShop(shopDomain)

    const stats = {
      totalProducts: products.length,
      lastSyncTime: syncLogs.length > 0 ? syncLogs[0].createdAt : null,
      successfulSyncs: syncLogs.filter((log) => log.status === "success").length,
      failedSyncs: syncLogs.filter((log) => log.status === "error").length,
      pendingSyncs: syncLogs.filter((log) => log.status === "pending").length,
      recentLogs: syncLogs.slice(0, 10),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Sync status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
