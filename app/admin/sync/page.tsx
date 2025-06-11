import SyncDashboard from "@/components/sync-dashboard"
import RealTimeInventory from "@/components/real-time-inventory"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SyncPage() {
  // In production, get shop domain from authentication/session
  const shopDomain = "example-shop.myshopify.com"

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Real-time Sync Management</h1>
        <p className="text-gray-600 mt-2">Monitor and manage real-time synchronization with your Shopify store</p>
      </div>

      <Tabs defaultValue="sync-dashboard">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sync-dashboard">Sync Dashboard</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="sync-dashboard">
          <SyncDashboard shopDomain={shopDomain} />
        </TabsContent>

        <TabsContent value="inventory">
          <RealTimeInventory shopDomain={shopDomain} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
