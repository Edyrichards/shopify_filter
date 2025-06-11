"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, BarChart, PieChart, Activity } from "lucide-react"

interface MetricPoint {
  timestamp: string
  value: number
}

interface MetricSeries {
  name: string
  data: MetricPoint[]
}

export default function MetricsDashboard() {
  const [webhookMetrics, setWebhookMetrics] = useState<MetricSeries[]>([])
  const [syncMetrics, setSyncMetrics] = useState<MetricSeries[]>([])
  const [errorMetrics, setErrorMetrics] = useState<MetricSeries[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<MetricSeries[]>([])

  useEffect(() => {
    // Fetch metrics data
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/metrics/dashboard")
        const data = await response.json()

        setWebhookMetrics(data.webhookMetrics)
        setSyncMetrics(data.syncMetrics)
        setErrorMetrics(data.errorMetrics)
        setPerformanceMetrics(data.performanceMetrics)
      } catch (error) {
        console.error("Failed to fetch metrics:", error)
      }
    }

    fetchMetrics()

    // Refresh every minute
    const interval = setInterval(fetchMetrics, 60000)
    return () => clearInterval(interval)
  }, [])

  // Mock chart rendering - in a real app, use a charting library like Chart.js or Recharts
  const renderChart = (series: MetricSeries[], type: "line" | "bar" | "pie") => {
    if (!series.length) return <div className="p-8 text-center text-gray-500">No data available</div>

    return (
      <div className="h-64 w-full bg-gray-100 rounded-lg flex items-center justify-center">
        {type === "line" && <LineChart className="h-8 w-8 text-gray-400" />}
        {type === "bar" && <BarChart className="h-8 w-8 text-gray-400" />}
        {type === "pie" && <PieChart className="h-8 w-8 text-gray-400" />}
        <span className="ml-2 text-gray-500">Chart: {series.map((s) => s.name).join(", ")}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Metrics Dashboard</h2>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <Tabs defaultValue="webhooks">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="sync">Sync Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="performance">System Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Volume</CardTitle>
              </CardHeader>
              <CardContent>
                {renderChart(
                  [
                    { name: "Product Updates", data: [] },
                    { name: "Inventory Updates", data: [] },
                  ],
                  "line",
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook Response Time</CardTitle>
              </CardHeader>
              <CardContent>{renderChart([{ name: "Avg Response Time (ms)", data: [] }], "line")}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Success Rate</CardTitle>
            </CardHeader>
            <CardContent>{renderChart([{ name: "Success Rate (%)", data: [] }], "line")}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sync Operations</CardTitle>
              </CardHeader>
              <CardContent>
                {renderChart(
                  [
                    { name: "Products Synced", data: [] },
                    { name: "Variants Synced", data: [] },
                  ],
                  "bar",
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sync Duration</CardTitle>
              </CardHeader>
              <CardContent>{renderChart([{ name: "Avg Sync Time (ms)", data: [] }], "line")}</CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {renderChart(
                [
                  { name: "Network Errors", data: [] },
                  { name: "Validation Errors", data: [] },
                  { name: "Timeout Errors", data: [] },
                  { name: "Other Errors", data: [] },
                ],
                "pie",
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error Trend</CardTitle>
            </CardHeader>
            <CardContent>{renderChart([{ name: "Errors Over Time", data: [] }], "line")}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>{renderChart([{ name: "CPU Usage (%)", data: [] }], "line")}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>{renderChart([{ name: "Memory Usage (MB)", data: [] }], "line")}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>API Response Time</CardTitle>
            </CardHeader>
            <CardContent>{renderChart([{ name: "Avg API Response Time (ms)", data: [] }], "line")}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
