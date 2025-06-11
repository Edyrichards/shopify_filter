import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SyncDashboard from "@/components/sync-dashboard"
import RealTimeInventory from "@/components/real-time-inventory"
import AnalyticsDashboard from "@/components/analytics-dashboard"
import MetricsDashboard from "@/components/metrics-dashboard"
import AdvancedFilters from "@/components/advanced-filters"
import AdvancedMerchandising from "@/components/advanced-merchandising"

export default function AdminDashboard() {
  // In production, get shop domain from authentication/session
  const shopDomain = "example-shop.myshopify.com"

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your Shopify AI Search & Filter app</p>
      </div>

      <Tabs defaultValue="sync" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="sync">Sync</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="merchandising">Merchandising</TabsTrigger>
        </TabsList>

        <TabsContent value="sync">
          <SyncDashboard shopDomain={shopDomain} />
        </TabsContent>

        <TabsContent value="inventory">
          <RealTimeInventory shopDomain={shopDomain} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="metrics">
          <MetricsDashboard />
        </TabsContent>

        <TabsContent value="filters">
          <AdvancedFilters />
        </TabsContent>

        <TabsContent value="merchandising">
          <AdvancedMerchandising />
        </TabsContent>
      </Tabs>
    </div>
  )
}
