"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw, Search, AlertTriangle, Package, TrendingDown, TrendingUp } from "lucide-react"

interface InventoryItem {
  id: string
  productTitle: string
  variantTitle: string
  sku: string
  available: number
  reserved: number
  onHand: number
  committed: number
  incoming: number
  lastUpdated: Date
}

interface RecentUpdate {
  type: string
  data: any
  timestamp: Date
}

export default function RealTimeInventory({ shopDomain }: { shopDomain: string }) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([])
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stockThreshold, setStockThreshold] = useState(5)
  const { toast } = useToast()

  // Load inventory data
  useEffect(() => {
    fetchInventoryData()
  }, [shopDomain])

  // Filter items when search term changes
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      setFilteredItems(
        inventoryItems.filter(
          (item) =>
            item.productTitle.toLowerCase().includes(term) ||
            item.variantTitle.toLowerCase().includes(term) ||
            item.sku.toLowerCase().includes(term),
        ),
      )
    } else {
      setFilteredItems(inventoryItems)
    }
  }, [searchTerm, inventoryItems])

  // Update low stock items when inventory or threshold changes
  useEffect(() => {
    setLowStockItems(inventoryItems.filter((item) => item.available <= stockThreshold))
  }, [inventoryItems, stockThreshold])

  // Set up real-time inventory updates
  useEffect(() => {
    const handleInventoryUpdate = (event: CustomEvent) => {
      const { shopDomain: eventShop, eventType, data } = event.detail

      if (eventShop === shopDomain && eventType === "inventory_updated") {
        // Show toast notification
        toast({
          title: "Inventory Updated",
          description: `${data.productTitle || "Product"} inventory changed to ${data.available} units`,
          variant: "default",
        })

        setRecentUpdates((prev) => [
          {
            type: "inventory_change",
            data,
            timestamp: new Date(),
          },
          ...prev.slice(0, 9),
        ])

        // Update inventory items
        setInventoryItems((prev) =>
          prev.map((item) =>
            item.id === data.variantId ? { ...item, available: data.available, lastUpdated: new Date() } : item,
          ),
        )
      }
    }

    window.addEventListener("shopify-sync-update", handleInventoryUpdate as EventListener)

    return () => {
      window.removeEventListener("shopify-sync-update", handleInventoryUpdate as EventListener)
    }
  }, [shopDomain, toast])

  const fetchInventoryData = async () => {
    setIsLoading(true)
    try {
      // In production, fetch from API
      // Mock data for now
      setTimeout(() => {
        setInventoryItems([
          {
            id: "1",
            productTitle: "Premium T-Shirt",
            variantTitle: "Black / Medium",
            sku: "TSHIRT-BLK-M",
            available: 15,
            reserved: 3,
            onHand: 18,
            committed: 3,
            incoming: 25,
            lastUpdated: new Date(),
          },
          {
            id: "2",
            productTitle: "Running Shoes",
            variantTitle: "Blue / Size 42",
            sku: "SHOES-BLU-42",
            available: 2,
            reserved: 1,
            onHand: 3,
            committed: 1,
            incoming: 10,
            lastUpdated: new Date(),
          },
          {
            id: "3",
            productTitle: "Leather Wallet",
            variantTitle: "Brown",
            sku: "WALLET-BRN",
            available: 8,
            reserved: 0,
            onHand: 8,
            committed: 0,
            incoming: 0,
            lastUpdated: new Date(),
          },
          {
            id: "4",
            productTitle: "Winter Jacket",
            variantTitle: "Navy / Large",
            sku: "JACKET-NAV-L",
            available: 0,
            reserved: 2,
            onHand: 2,
            committed: 2,
            incoming: 15,
            lastUpdated: new Date(),
          },
          {
            id: "5",
            productTitle: "Summer Dress",
            variantTitle: "Floral / Small",
            sku: "DRESS-FLR-S",
            available: 3,
            reserved: 1,
            onHand: 4,
            committed: 1,
            incoming: 0,
            lastUpdated: new Date(),
          },
        ])
        setIsLoading(false)
      }, 800)
    } catch (error) {
      console.error("Failed to fetch inventory data:", error)
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const refreshInventory = async () => {
    setIsRefreshing(true)
    try {
      await fetchInventoryData()
      toast({
        title: "Refreshed",
        description: "Inventory data has been updated",
        variant: "default",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStockStatus = (available: number) => {
    if (available === 0) return { status: "Out of Stock", color: "bg-red-100 text-red-800" }
    if (available <= stockThreshold) return { status: "Low Stock", color: "bg-yellow-100 text-yellow-800" }
    if (available <= stockThreshold * 2) return { status: "Medium Stock", color: "bg-blue-100 text-blue-800" }
    return { status: "In Stock", color: "bg-green-100 text-green-800" }
  }

  const getStockPercentage = (available: number, onHand: number) => {
    return onHand > 0 ? (available / onHand) * 100 : 0
  }

  const getStockTrend = (item: InventoryItem) => {
    // Mock trend calculation - in production, compare with historical data
    const trend = Math.random() > 0.5 ? "up" : "down"
    return trend === "up" ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading inventory data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Real-time Inventory Tracking</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={refreshInventory} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryItems.length}</div>
            <p className="text-xs text-muted-foreground">Active variants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Below {stockThreshold} units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inventoryItems.filter((item) => item.available === 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Needs restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Available</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {inventoryItems.reduce((sum, item) => sum + item.available, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Units in stock</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all-inventory">
        <TabsList>
          <TabsTrigger value="all-inventory">All Inventory</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="recent-updates">Recent Updates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="all-inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item.available)
                  const stockPercentage = getStockPercentage(item.available, item.onHand)

                  return (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div>
                            <h4 className="font-medium">{item.productTitle}</h4>
                            <p className="text-sm text-gray-500">{item.variantTitle}</p>
                            <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                          </div>
                          {getStockTrend(item)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Available</p>
                            <p className="font-medium">{item.available}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Reserved</p>
                            <p className="font-medium">{item.reserved}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">On Hand</p>
                            <p className="font-medium">{item.onHand}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Committed</p>
                            <p className="font-medium">{item.committed}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Incoming</p>
                            <p className="font-medium">{item.incoming}</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">Stock Level</span>
                            <span className="text-xs text-gray-500">{stockPercentage.toFixed(0)}%</span>
                          </div>
                          <Progress value={stockPercentage} className="h-2" />
                        </div>
                      </div>

                      <div className="ml-4 text-right">
                        <Badge className={stockStatus.color}>{stockStatus.status}</Badge>
                        <p className="text-xs text-gray-500 mt-1">Updated: {item.lastUpdated.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  )
                })}

                {filteredItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? "No products match your search" : "No inventory data available"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                    <div>
                      <h4 className="font-medium">{item.productTitle}</h4>
                      <p className="text-sm text-gray-500">{item.variantTitle}</p>
                      <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-600">{item.available} units left</p>
                      {item.incoming > 0 && <p className="text-xs text-green-600">{item.incoming} incoming</p>}
                    </div>
                  </div>
                ))}

                {lowStockItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No low stock items at this time</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent-updates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Inventory Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUpdates.map((update, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{update.data.productTitle || "Product Updated"}</p>
                      <p className="text-sm text-gray-500">Inventory changed to {update.data.available} units</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">Live Update</Badge>
                      <p className="text-xs text-gray-500 mt-1">{update.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}

                {recentUpdates.length === 0 && <div className="text-center py-8 text-gray-500">No recent updates</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Low Stock Threshold</label>
                <Input
                  type="number"
                  value={stockThreshold}
                  onChange={(e) => setStockThreshold(Number(e.target.value))}
                  min="1"
                  max="100"
                />
                <p className="text-xs text-gray-500">
                  Products with inventory below this number will be flagged as low stock
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notification Settings</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Real-time inventory alerts</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Low stock notifications</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span className="text-sm">Out of stock alerts</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span className="text-sm">Daily inventory summary</span>
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
