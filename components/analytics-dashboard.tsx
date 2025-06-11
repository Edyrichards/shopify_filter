"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, TrendingUp, Search, Filter, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AnalyticsData {
  filtersUsed: {
    category: Array<{ name: string; usage: number; conversionRate: number }>
    priceRange: Array<{ range: string; usage: number; conversionRate: number }>
    tags: Array<{ name: string; usage: number; conversionRate: number }>
    overall: { withFilters: number; withoutFilters: number; conversionImprovement: number }
  }
  searchTrends: Array<{ date: string; searches: number; conversions: number; conversionRate: number }>
  topSearches: Array<{ term: string; count: number; conversions: number; conversionRate: number; trend: string }>
  noResults: Array<{ term: string; count: number; lastSeen: string; suggestedActions: string[] }>
  summary: {
    totalSearches: number
    totalConversions: number
    averageConversionRate: number
    filterUsageRate: number
    topPerformingFilter: string
    improvementOpportunities: string[]
  }
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState("7d")

  const fetchAnalytics = async (range = "7d") => {
    setIsLoading(true)
    try {
      const endDate = new Date()
      const startDate = new Date()

      switch (range) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7)
          break
        case "30d":
          startDate.setDate(endDate.getDate() - 30)
          break
        case "90d":
          startDate.setDate(endDate.getDate() - 90)
          break
      }

      const params = new URLSearchParams({
        from: startDate.toISOString().split("T")[0],
        to: endDate.toISOString().split("T")[0],
      })

      const response = await fetch(`/api/analytics?${params.toString()}`)
      const data = await response.json()

      setAnalyticsData(data)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics(dateRange)
  }, [dateRange])

  const handleDateRangeChange = (range: string) => {
    setDateRange(range)
    fetchAnalytics(range)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="search-terms">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search-terms">Search Terms</TabsTrigger>
            <TabsTrigger value="filter-usage">Filter Usage</TabsTrigger>
            <TabsTrigger value="no-results">No Results</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          <TabsContent value="search-terms">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-16 mb-1" />
                        <Skeleton className="h-3 w-12" />
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

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex gap-2">
          <Button
            variant={dateRange === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => handleDateRangeChange("7d")}
          >
            7 days
          </Button>
          <Button
            variant={dateRange === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => handleDateRangeChange("30d")}
          >
            30 days
          </Button>
          <Button
            variant={dateRange === "90d" ? "default" : "outline"}
            size="sm"
            onClick={() => handleDateRangeChange("90d")}
          >
            90 days
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.summary.totalSearches.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.summary.filterUsageRate.toFixed(1)}% used filters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filter Usage</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.filtersUsed.overall.withFilters.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.summary.filterUsageRate.toFixed(1)}% of all searches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analyticsData.summary.averageConversionRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              +{analyticsData.filtersUsed.overall.conversionImprovement}% with filters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(analyticsData.summary.totalConversions * 45.67).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From search-driven sales</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="search-terms">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search-terms">Search Terms</TabsTrigger>
          <TabsTrigger value="filter-usage">Filter Usage</TabsTrigger>
          <TabsTrigger value="no-results">No Results</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="search-terms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Top Search Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topSearches.map((term, index) => (
                  <div key={term.term} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{term.term}</p>
                        <p className="text-sm text-gray-500">{term.count} searches</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{term.conversions} conversions</p>
                      <p className="text-sm text-gray-500">{(term.conversionRate * 100).toFixed(1)}% rate</p>
                      <Badge variant={term.trend === "up" ? "default" : "secondary"} className="text-xs">
                        {term.trend}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filter-usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Category Filters</h4>
                  {analyticsData.filtersUsed.category.map((filter) => (
                    <div key={filter.name} className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="font-medium">{filter.name}</span>
                        <span className="text-sm text-gray-500">{filter.usage}% usage</span>
                      </div>
                      <Progress value={filter.usage} className="h-2" />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Conversion rate: {filter.conversionRate.toFixed(1)}%</span>
                        <span>{Math.round((filter.usage * analyticsData.summary.totalSearches) / 100)} uses</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-medium mb-3">Price Range Filters</h4>
                  {analyticsData.filtersUsed.priceRange.map((filter) => (
                    <div key={filter.range} className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="font-medium">{filter.range}</span>
                        <span className="text-sm text-gray-500">{filter.usage}% usage</span>
                      </div>
                      <Progress value={filter.usage} className="h-2" />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Conversion rate: {filter.conversionRate.toFixed(1)}%</span>
                        <span>{Math.round((filter.usage * analyticsData.summary.totalSearches) / 100)} uses</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-medium mb-3">Tag Filters</h4>
                  {analyticsData.filtersUsed.tags.map((filter) => (
                    <div key={filter.name} className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="font-medium">{filter.name}</span>
                        <span className="text-sm text-gray-500">{filter.usage}% usage</span>
                      </div>
                      <Progress value={filter.usage} className="h-2" />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Conversion rate: {filter.conversionRate.toFixed(1)}%</span>
                        <span>{Math.round((filter.usage * analyticsData.summary.totalSearches) / 100)} uses</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="no-results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Terms with No Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.noResults.map((term) => (
                  <div key={term.term} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{term.term}</span>
                      <p className="text-sm text-gray-500">Last seen: {term.lastSeen}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{term.count} searches</Badge>
                      <span className="text-sm text-gray-500">No results</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Recommendations:</strong>
                </p>
                <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                  {analyticsData.summary.improvementOpportunities.map((opportunity, index) => (
                    <li key={index}>• {opportunity}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Search vs Filter Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Search Only</span>
                    <div className="text-right">
                      <p className="font-medium">
                        {(
                          (analyticsData.filtersUsed.overall.withoutFilters / analyticsData.summary.totalSearches) *
                          analyticsData.summary.averageConversionRate *
                          100
                        ).toFixed(1)}
                        % conversion
                      </p>
                      <p className="text-sm text-gray-500">
                        {analyticsData.filtersUsed.overall.withoutFilters} sessions
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Search + Filters</span>
                    <div className="text-right">
                      <p className="font-medium">
                        {(
                          (analyticsData.filtersUsed.overall.withFilters / analyticsData.summary.totalSearches) *
                          analyticsData.summary.averageConversionRate *
                          (1 + analyticsData.filtersUsed.overall.conversionImprovement / 100) *
                          100
                        ).toFixed(1)}
                        % conversion
                      </p>
                      <p className="text-sm text-gray-500">{analyticsData.filtersUsed.overall.withFilters} sessions</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-green-600 font-medium">
                      +{analyticsData.filtersUsed.overall.conversionImprovement}% improvement with filters
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold">{analyticsData.summary.topPerformingFilter}</h3>
                    <p className="text-sm text-gray-500">Highest conversion rate</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Usage Rate</span>
                      <span className="font-medium">
                        {analyticsData.filtersUsed.tags.find(
                          (t) => t.name === analyticsData.summary.topPerformingFilter,
                        )?.usage || 0}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversion Rate</span>
                      <span className="font-medium">
                        {analyticsData.filtersUsed.tags
                          .find((t) => t.name === analyticsData.summary.topPerformingFilter)
                          ?.conversionRate.toFixed(1) || 0}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue Impact</span>
                      <span className="font-medium text-green-600">
                        $
                        {(
                          (analyticsData.filtersUsed.tags.find(
                            (t) => t.name === analyticsData.summary.topPerformingFilter,
                          )?.usage || 0) *
                          analyticsData.summary.totalSearches *
                          0.45
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
