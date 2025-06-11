"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUp, ArrowDown, Pin, EyeOff, TrendingUp, Package, Loader2 } from "lucide-react"
import Image from "next/image"
import { debounce } from "@/lib/utils"

interface Product {
  id: string
  name: string
  status: "pinned" | "boosted" | "demoted" | "hidden" | "normal"
  sales: number
  preOrder: boolean
  image?: string
  price: number
}

interface BundleRecommendation {
  id: string
  name: string
  products: Array<{ id: string; name: string; image: string }>
  discount: number
  estimatedRevenue: number
}

export default function AdvancedMerchandising() {
  const [products, setProducts] = useState<Product[]>([])
  const [bundles, setBundles] = useState<BundleRecommendation[]>([])
  const [preOrderProducts, setPreOrderProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Settings state
  const [settings, setSettings] = useState({
    frequentlyBoughtTogether: true,
    complementaryProducts: true,
    crossSellRecommendations: false,
    homepageRecommendations: true,
    collectionPage: true,
    productPage: true,
    cartPage: false,
    preOrdersEnabled: true,
    autoFulfillWhenInStock: true,
  })

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/products?merchandising=true&limit=20")
      const data = await response.json()

      if (data.products) {
        setProducts(data.products)
        setPreOrderProducts(data.products.filter((p: Product) => p.preOrder))
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBundles = async () => {
    try {
      const response = await fetch("/api/analytics?type=bundles")
      const data = await response.json()

      if (data.recommendedBundles) {
        setBundles(data.recommendedBundles)
      }
    } catch (error) {
      console.error("Error fetching bundles:", error)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchBundles()
  }, [])

  // Debounced action handlers to prevent API spam
  const debouncedUpdateStatus = useCallback(
    debounce(async (productId: string, newStatus: string) => {
      try {
        const response = await fetch(`/api/products/${productId}/merchandising`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })

        if (response.ok) {
          // Update local state optimistically
          setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, status: newStatus as any } : p)))
        }
      } catch (error) {
        console.error("Error updating product status:", error)
      } finally {
        setActionLoading(null)
      }
    }, 300),
    [],
  )

  const handleStatusChange = (productId: string, newStatus: string) => {
    setActionLoading(productId)
    debouncedUpdateStatus(productId, newStatus)
  }

  const handleSettingChange = async (setting: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [setting]: value }))

    try {
      await fetch("/api/merchandising/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [setting]: value }),
      })
    } catch (error) {
      console.error("Error updating setting:", error)
    }
  }

  const applyBundle = async (bundleId: string) => {
    try {
      const response = await fetch(`/api/merchandising/bundles/${bundleId}/apply`, {
        method: "POST",
      })

      if (response.ok) {
        // Refresh bundles after applying
        fetchBundles()
      }
    } catch (error) {
      console.error("Error applying bundle:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pinned":
        return <Pin className="h-4 w-4 text-blue-500" />
      case "boosted":
        return <ArrowUp className="h-4 w-4 text-green-500" />
      case "demoted":
        return <ArrowDown className="h-4 w-4 text-orange-500" />
      case "hidden":
        return <EyeOff className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pinned":
        return "bg-blue-100 text-blue-800"
      case "boosted":
        return "bg-green-100 text-green-800"
      case "demoted":
        return "bg-orange-100 text-orange-800"
      case "hidden":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Tabs defaultValue="merchandising">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="merchandising">Visual Merchandising</TabsTrigger>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
            <TabsTrigger value="preorders">Pre-Orders</TabsTrigger>
          </TabsList>
          <TabsContent value="merchandising" className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-15 w-15 rounded-md" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="merchandising">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="merchandising">Visual Merchandising</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="preorders">Pre-Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="merchandising" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Product Merchandising Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Image
                        src={product.image || `/placeholder.svg?height=60&width=60&text=${product.name.charAt(0)}`}
                        alt={product.name}
                        width={60}
                        height={60}
                        className="rounded-md object-cover"
                      />
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-gray-500">{product.sales} sales this month</p>
                        <p className="text-sm font-medium">${product.price}</p>
                        {product.preOrder && (
                          <Badge variant="outline" className="mt-1">
                            <Package className="h-3 w-3 mr-1" />
                            Pre-order
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(product.status)}>
                        {getStatusIcon(product.status)}
                        {product.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === product.id}
                          onClick={() => handleStatusChange(product.id, "pinned")}
                        >
                          {actionLoading === product.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Pin"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === product.id}
                          onClick={() => handleStatusChange(product.id, "boosted")}
                        >
                          Boost
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === product.id}
                          onClick={() => handleStatusChange(product.id, "demoted")}
                        >
                          Demote
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === product.id}
                          onClick={() => handleStatusChange(product.id, "hidden")}
                        >
                          Hide
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Product Bundles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Frequently Bought Together</span>
                    <Switch
                      checked={settings.frequentlyBoughtTogether}
                      onCheckedChange={(checked) => handleSettingChange("frequentlyBoughtTogether", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Complementary Products</span>
                    <Switch
                      checked={settings.complementaryProducts}
                      onCheckedChange={(checked) => handleSettingChange("complementaryProducts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cross-sell Recommendations</span>
                    <Switch
                      checked={settings.crossSellRecommendations}
                      onCheckedChange={(checked) => handleSettingChange("crossSellRecommendations", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendation Placement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Homepage Recommendations</span>
                    <Switch
                      checked={settings.homepageRecommendations}
                      onCheckedChange={(checked) => handleSettingChange("homepageRecommendations", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Collection Page</span>
                    <Switch
                      checked={settings.collectionPage}
                      onCheckedChange={(checked) => handleSettingChange("collectionPage", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Product Page</span>
                    <Switch
                      checked={settings.productPage}
                      onCheckedChange={(checked) => handleSettingChange("productPage", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cart Page</span>
                    <Switch
                      checked={settings.cartPage}
                      onCheckedChange={(checked) => handleSettingChange("cartPage", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Product Bundles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {bundles.map((bundle) => (
                  <div key={bundle.id} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{bundle.name}</h4>
                    <div className="space-y-2">
                      {bundle.products.map((product, index) => (
                        <div key={product.id} className="flex items-center gap-2">
                          <Image
                            src={product.image || `/placeholder.svg?height=30&width=30&text=${index + 1}`}
                            alt={product.name}
                            width={30}
                            height={30}
                            className="rounded object-cover"
                          />
                          <span className="text-sm">{product.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-sm font-medium">Save {bundle.discount}%</span>
                      <Button size="sm" onClick={() => applyBundle(bundle.id)}>
                        Apply
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Est. revenue: ${bundle.estimatedRevenue}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preorders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Pre-order Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enable Pre-orders</label>
                    <Switch
                      checked={settings.preOrdersEnabled}
                      onCheckedChange={(checked) => handleSettingChange("preOrdersEnabled", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Auto-fulfill when in stock</label>
                    <Switch
                      checked={settings.autoFulfillWhenInStock}
                      onCheckedChange={(checked) => handleSettingChange("autoFulfillWhenInStock", checked)}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Active Pre-orders</h4>
                  <div className="space-y-3">
                    {preOrderProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Image
                            src={product.image || `/placeholder.svg?height=40&width=40&text=${product.name.charAt(0)}`}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded object-cover"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">Expected: Dec 15, 2025</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{Math.floor(product.sales * 0.3)} orders</p>
                          <p className="text-sm text-gray-500">
                            ${(product.sales * product.price * 0.3).toFixed(0)} revenue
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
