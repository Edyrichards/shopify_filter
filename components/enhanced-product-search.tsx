"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react"
import Image from "next/image"
import { debounce } from "@/lib/utils"
import { buildQueryString, type FilterOptions } from "@/lib/product-filter"
import { Mic, Camera } from "lucide-react"

interface Product {
  id: number
  name: string
  price: number
  category: string
  tags: string[]
  image: string
  rating: number
  reviews: number
}

interface SearchResponse {
  products: Product[]
  pagination: {
    offset: number
    limit: number
    total: number
    hasNext: boolean
    hasPrevious: boolean
    totalPages: number
    currentPage: number
  }
  appliedFilters: any
  availableFilters: {
    categories: string[]
    priceRange: { min: number; max: number }
    tags: string[]
    sortOptions: Array<{ value: string; label: string }>
  }
  queryParams: Record<string, string>
}

export default function EnhancedProductSearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<FilterOptions>({
    offset: 0,
    limit: 10,
  })
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, filterOptions: FilterOptions) => {
      setIsLoading(true)
      try {
        const queryString = buildQueryString({
          ...filterOptions,
          search: searchQuery || undefined,
        })

        const response = await fetch(`/api/products?${queryString}`)
        const data = await response.json()
        setResults(data)
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setIsLoading(false)
      }
    }, 300),
    [],
  )

  // Perform search when filters or search term change
  useEffect(() => {
    debouncedSearch(searchTerm, filters)
  }, [searchTerm, filters, debouncedSearch])

  // Update filters
  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      offset: newFilters.offset !== undefined ? newFilters.offset : 0, // Reset to first page unless explicitly set
    }))
  }

  // Handle pagination
  const goToPage = (page: number) => {
    const offset = (page - 1) * (filters.limit || 10)
    updateFilters({ offset })
  }

  // Handle tag filter toggle
  const toggleTag = (tag: string) => {
    const currentTags = filters.tags || []
    const newTags = currentTags.includes(tag) ? currentTags.filter((t) => t !== tag) : [...currentTags, tag]

    updateFilters({ tags: newTags.length > 0 ? newTags : undefined })
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({ offset: 0, limit: 10 })
    setSearchTerm("")
  }

  // Handle price range change
  const handlePriceChange = (values: number[]) => {
    updateFilters({
      minPrice: values[0],
      maxPrice: values[1],
    })
  }

  return (
    <div className="boost-search-container" data-results-layout="grid">
      {/* Search Header */}
      <div className="boost-search-interface">
        <div className="boost-search-input-container">
          <Search className="boost-search-icon" />
          <Input
            type="search"
            placeholder="Search for products..."
            className="boost-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="boost-search-actions">
            <button className="boost-action-btn" title="Voice Search">
              <Mic className="h-5 w-5" />
            </button>
            <button className="boost-action-btn" title="Visual Search">
              <Camera className="h-5 w-5" />
            </button>
            <button className="boost-action-btn boost-search-submit" title="Search">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Applied Filters */}
      {results?.appliedFilters && Object.keys(results.appliedFilters).length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium">Applied filters:</span>
          {results.appliedFilters.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {results.appliedFilters.category}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ category: undefined })} />
            </Badge>
          )}
          {results.appliedFilters.priceRange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Price: ${results.appliedFilters.priceRange.min}-${results.appliedFilters.priceRange.max}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilters({ minPrice: undefined, maxPrice: undefined })}
              />
            </Badge>
          )}
          {results.appliedFilters.tags?.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              {tag}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleTag(tag)} />
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        {showFilters && results?.availableFilters && (
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4 space-y-6">
                {/* Category Filter */}
                <div>
                  <h3 className="font-medium mb-3">Category</h3>
                  <Select
                    value={filters.category || ""}
                    onValueChange={(value) => updateFilters({ category: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {results.availableFilters.categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <h3 className="font-medium mb-3">Price Range</h3>
                  <Slider
                    defaultValue={[
                      filters.minPrice || results.availableFilters.priceRange.min,
                      filters.maxPrice || results.availableFilters.priceRange.max,
                    ]}
                    max={results.availableFilters.priceRange.max}
                    min={results.availableFilters.priceRange.min}
                    step={1}
                    onValueChange={handlePriceChange}
                    className="py-4"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>${filters.minPrice || results.availableFilters.priceRange.min}</span>
                    <span>${filters.maxPrice || results.availableFilters.priceRange.max}</span>
                  </div>
                </div>

                {/* Tags Filter */}
                <div>
                  <h3 className="font-medium mb-3">Tags</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {results.availableFilters.tags.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={tag}
                          checked={filters.tags?.includes(tag) || false}
                          onCheckedChange={() => toggleTag(tag)}
                        />
                        <label htmlFor={tag} className="text-sm capitalize">
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <h3 className="font-medium mb-3">Sort By</h3>
                  <Select
                    value={filters.sort || ""}
                    onValueChange={(value) => updateFilters({ sort: (value as FilterOptions["sort"]) || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      {results.availableFilters.sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results */}
        <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
          {/* Results Header */}
          {results && (
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600">
                Showing {results.pagination.offset + 1}-
                {Math.min(results.pagination.offset + results.pagination.limit, results.pagination.total)} of{" "}
                {results.pagination.total} results
              </div>
              <Select
                value={filters.limit?.toString() || "10"}
                onValueChange={(value) => updateFilters({ limit: Number(value), offset: 0 })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Searching...</p>
            </div>
          )}

          {/* Products Grid */}
          {results && !isLoading && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.products.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">${product.price}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm">⭐ {product.rating}</span>
                          <span className="text-xs text-gray-500">({product.reviews})</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {product.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {results.pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(results.pagination.currentPage - 1)}
                    disabled={!results.pagination.hasPrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, results.pagination.totalPages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <Button
                          key={page}
                          variant={page === results.pagination.currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(results.pagination.currentPage + 1)}
                    disabled={!results.pagination.hasNext}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* No Results */}
              {results.products.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No products found matching your criteria.</p>
                  <Button variant="outline" onClick={clearFilters} className="mt-2">
                    Clear filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Debug Info (Development only) */}
      {process.env.NODE_ENV === "development" && results && (
        <Card className="mt-8">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Debug Info</h3>
            <div className="text-xs space-y-1">
              <p>
                <strong>Query Params:</strong> {JSON.stringify(results.queryParams)}
              </p>
              <p>
                <strong>Applied Filters:</strong> {JSON.stringify(results.appliedFilters)}
              </p>
              <p>
                <strong>Pagination:</strong> {JSON.stringify(results.pagination)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
