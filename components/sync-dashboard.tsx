"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, CheckCircle, XCircle, Clock, Database, Zap } from "lucide-react"

interface SyncStats {
  totalProducts: number
  lastSyncTime: string | null
  successfulSyncs: number
  failedSyncs: number
  pendingSyncs: number
  recentLogs: Array<{
    id: string
    eventType: string
    shopifyId: string
    status: "success" | "error" | "pending"
    errorMessage?: string
    createdAt: string
  }>
}

export default function SyncDashboard({ shopDomain }: { shopDomain: string }) {
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [realTimeUpdates, setRealTimeUpdates] = useState<any[]>([])

  useEffect(() => {
    fetchSyncStats()

    // Set up real-time updates listener
    const handleSyncUpdate = (event: CustomEvent) => {
      const { shopDomain: eventShop, eventType, data, timestamp } = event.detail
      if (eventShop === shopDomain) {
        setRealTimeUpdates((prev) => [
          { eventType, data, timestamp },
          ...prev.slice(0, 9), // Keep last 10 updates
        ])

        // Refresh stats after updates
        if (eventType === "full_sync_completed") {
          fetchSyncStats()
        }
      }
    }

    window.addEventListener("shopify-sync-update", handleSyncUpdate as EventListener)

    return () => {
      window.removeEventListener("shopify-sync-update", handleSyncUpdate as EventListener)
    }
  }, [shopDomain])

  const fetchSyncStats = async () => {
    try {
      const response = await fetch(`/api/sync/status?shopDomain=${shopDomain}`)
      const data = await response.json()
      setSyncStats(data)
    } catch (error) {
      console.error("Failed to fetch sync stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const initiateFullSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch("/api/sync/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopDomain,
          accessToken: "your-access-token", // In production, get from secure storage
        }),
      })

      if (response.ok) {
        // Sync initiated successfully
        setTimeout(() => {
          fetchSyncStats()
          setIsSyncing(false)
        }, 2000)
      }
    } catch (error) {
      console.error("Failed to initiate sync:", error)
      setIsSyncing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading sync status...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Product Sync Dashboard</h2>
        <Button onClick={initiateFullSync} disabled={isSyncing} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Full Sync"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncStats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {syncStats?.lastSyncTime
                ? `Last sync: ${new Date(syncStats.lastSyncTime).toLocaleString()}`
                : "Never synced"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Syncs</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{syncStats?.successfulSyncs || 0}</div>
            <p className="text-xs text-muted-foreground">Operations completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Syncs</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{syncStats?.failedSyncs || 0}</div>
            <p className="text-xs text-muted-foreground">Errors encountered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Syncs</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{syncStats?.pendingSyncs || 0}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent-logs">
        <TabsList>
          <TabsTrigger value="recent-logs">Recent Sync Logs</TabsTrigger>
          <TabsTrigger value="real-time">Real-time Updates</TabsTrigger>
          <TabsTrigger value="settings">Sync Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="recent-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {syncStats?.recentLogs?.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <p className="font-medium">{log.eventType.replace("_", " ").toUpperCase()}</p>
                        <p className="text-sm text-gray-500">Product ID: {log.shopifyId}</p>
                        {log.errorMessage && <p className="text-sm text-red-500">{log.errorMessage}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(log.status)}>{log.status}</Badge>
                      <p className="text-xs text-gray-500 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}

                {(!syncStats?.recentLogs || syncStats.recentLogs.length === 0) && (
                  <div className="text-center py-8 text-gray-500">No sync operations yet</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="real-time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Real-time Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {realTimeUpdates.map((update, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                    <div>
                      <p className="font-medium">{update.eventType.replace("_", " ").toUpperCase()}</p>
                      <p className="text-sm text-gray-600">{update.data.title || update.data.id || "Data updated"}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">Live</Badge>
                      <p className="text-xs text-gray-500 mt-1">{new Date(update.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}

                {realTimeUpdates.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No real-time updates yet</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sync Frequency</label>
                <select className="w-full p-2 border rounded-md">
                  <option value="real-time">Real-time (Webhooks)</option>
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Daily</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sync Options</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Sync product data</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Sync inventory levels</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Sync metafields</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span className="text-sm">Sync customer data</span>
                  </label>
                </div>
              </div>

              <Button className="w-full">Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
