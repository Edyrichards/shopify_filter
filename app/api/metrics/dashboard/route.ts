import { type NextRequest, NextResponse } from "next/server"

// Mock data for metrics dashboard
export async function GET(request: NextRequest) {
  // In production, fetch real metrics from your database or metrics service

  // Generate some mock data for demonstration
  const now = Date.now()
  const hourAgo = now - 60 * 60 * 1000

  const generateTimeSeries = (name: string, count: number, min: number, max: number) => {
    const data = []
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(hourAgo + (i * (60 * 60 * 1000)) / count).toISOString()
      const value = min + Math.random() * (max - min)
      data.push({ timestamp, value: Math.round(value * 100) / 100 })
    }
    return { name, data }
  }

  return NextResponse.json({
    webhookMetrics: [
      generateTimeSeries("Product Updates", 12, 10, 50),
      generateTimeSeries("Inventory Updates", 12, 20, 80),
    ],
    syncMetrics: [
      generateTimeSeries("Products Synced", 12, 50, 200),
      generateTimeSeries("Variants Synced", 12, 100, 500),
    ],
    errorMetrics: [
      generateTimeSeries("Network Errors", 12, 0, 5),
      generateTimeSeries("Validation Errors", 12, 0, 3),
      generateTimeSeries("Timeout Errors", 12, 0, 2),
      generateTimeSeries("Other Errors", 12, 0, 1),
    ],
    performanceMetrics: [
      generateTimeSeries("CPU Usage (%)", 12, 10, 80),
      generateTimeSeries("Memory Usage (MB)", 12, 100, 500),
      generateTimeSeries("Avg API Response Time (ms)", 12, 50, 300),
    ],
  })
}
