"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { Search, SlidersHorizontal, Tag, Star, Loader2, RotateCcw } from "lucide-react"
import { debounce } from "@/lib/utils"

import AdvancedFilters from "@/components/advanced-filters"
import AdvancedMerchandising from "@/components/advanced-merchandising"
import AnalyticsDashboard from "@/components/analytics-dashboard"

export default function ProductFilterDemo() {
  // API state
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalProducts, setTotalProducts] = useState(0)

  // Filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [priceRange, setPriceRange] = useState([0, 300])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(12)

  // Debounced search to avoid API spam
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setCurrentPage(1) // Reset to first page on new search
      fetchProducts(term, priceRange, selectedCategories, selectedTags, sortBy, 0, limit)
    }, 500),
    [priceRange, selectedCategories, selectedTags, sortBy, limit],
  )

  const fetchProducts = async (
    search: string,
    priceRange: number[],
    categories: string[],
    tags: string[],
    sort: string,
    offset: number,
    limit: number,
  ) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()

      if (search) params.set("search", search)
      if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString())
      if (priceRange[1] < 300) params.set("maxPrice", priceRange[1].toString())
      if (categories.length > 0) params.set("category", categories[0]) // Single category for now
      if (tags.length > 0) params.set("tags", tags.join(","))
      if (sort) params.set("sort", sort)
      params.set("offset", offset.toString())
      params.set("limit", limit.toString())

      const response = await fetch(`/api/products?${params.toString()}`)
      const data = await response.json()

      setProducts(data.products || [])
      setTotalProducts(data.pagination?.total || 0)

      // Update available categories from API response
      if (data.availableFilters?.categories) {
        setCategories(data.availableFilters.categories)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchProducts("", priceRange, selectedCategories, selectedTags, sortBy, 0, limit)
  }, [])

  // Handle search term changes with debounce
  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  // Handle filter changes
  useEffect(() => {
    if (searchTerm || selectedCategories.length > 0 || selectedTags.length > 0 || sortBy) {
      setCurrentPage(1)
      fetchProducts(searchTerm, priceRange, selectedCategories, selectedTags, sortBy, 0, limit)
    }
  }, [priceRange, selectedCategories, selectedTags, sortBy])

  // Handle pagination
  useEffect(() => {
    const offset = (currentPage - 1) * limit
    fetchProducts(searchTerm, priceRange, selectedCategories, selectedTags, sortBy, offset, limit)
  }, [currentPage])

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([category]) // Single category selection
    } else {
      setSelectedCategories([])
    }
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const resetFilters = () => {
    setSearchTerm("")
    setPriceRange([0, 300])
    setSelectedCategories([])
    setSelectedTags([])
    setSortBy("")
    setCurrentPage(1)
  }

  return (
    <section id="demo" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">See how it works</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Interactive demo of our AI-powered search and filter functionality
            </p>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-5xl rounded-xl border bg-white p-4 shadow-lg">
          <Tabs defaultValue="products">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="advanced-filters">Advanced Filters</TabsTrigger>
                <TabsTrigger value="merchandising">Merchandising</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full pl-8 sm:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value="products" className="mt-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-2 flex items-center gap-2 font-medium">
                          <SlidersHorizontal className="h-4 w-4" />
                          Filters
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <h4 className="mb-2 text-sm font-medium">Category</h4>
                            <div className="space-y-2">
                              {categories.map((category) => (
                                <div key={category} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={category}
                                    checked={selectedCategories.includes(category)}
                                    onCheckedChange={(checked) => handleCategoryChange(category, !!checked)}
                                  />
                                  <label htmlFor={category} className="text-sm">
                                    {category}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="mb-2 text-sm font-medium">Price Range</h4>
                            <Slider
                              defaultValue={[0, 100]}
                              max={200}
                              step={1}
                              value={priceRange}
                              onValueChange={setPriceRange}
                              className="py-4"
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-sm">${priceRange[0]}</span>
                              <span className="text-sm">${priceRange[1]}</span>
                            </div>
                          </div>

                          <div>
                            <h4 className="mb-2 text-sm font-medium">Sort By</h4>
                            <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value)}
                              className="w-full p-2 border rounded-md text-sm"
                            >
                              <option value="">Default</option>
                              <option value="price_asc">Price: Low to High</option>
                              <option value="price_desc">Price: High to Low</option>
                              <option value="name_asc">Name: A to Z</option>
                              <option value="name_desc">Name: Z to A</option>
                              <option value="rating_desc">Highest Rated</option>
                            </select>
                          </div>

                          <div>
                            <h4 className="mb-2 text-sm font-medium">Size</h4>
                            <div className="flex flex-wrap gap-2">
                              {["XS", "S", "M", "L", "XL"].map((size) => (
                                <Button key={size} variant="outline" className="h-8 w-8 p-0" size="sm">
                                  {size}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="mb-2 text-sm font-medium">Color</h4>
                            <div className="flex flex-wrap gap-2">
                              {["bg-black", "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500"].map(
                                (color) => (
                                  <div key={color} className={`h-6 w-6 cursor-pointer rounded-full border ${color}`} />
                                ),
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="mb-2 text-sm font-medium">Rating</h4>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="rating4" defaultChecked />
                              <label htmlFor="rating4" className="flex text-sm">
                                {[1, 2, 3, 4].map((i) => (
                                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ))}
                                <Star className="h-4 w-4 text-gray-300" />& up
                              </label>
                            </div>
                          </div>

                          <div>
                            <h4 className="mb-2 text-sm font-medium">Metafield</h4>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox id="waterproof" />
                                <label htmlFor="waterproof" className="text-sm">
                                  Waterproof
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="eco-friendly" />
                                <label htmlFor="eco-friendly" className="text-sm">
                                  Eco-Friendly
                                </label>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="mb-2 text-sm font-medium">Variants</h4>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox id="limited-edition" />
                                <label htmlFor="limited-edition" className="text-sm">
                                  Limited Edition
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-2 flex items-center gap-2 font-medium">
                          <Tag className="h-4 w-4" />
                          Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" className="h-7 rounded-full">
                            New Arrival
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 rounded-full">
                            Sale
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 rounded-full">
                            Popular
                          </Button>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <Button onClick={resetFilters} variant="outline" className="w-full" disabled={isLoading}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset Filters
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Products {totalProducts > 0 && `(${totalProducts} found)`}</h3>
                    {isLoading && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                          <div className="aspect-square bg-gray-200 animate-pulse" />
                          <CardContent className="p-4">
                            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                            <div className="h-3 bg-gray-200 rounded animate-pulse mb-2 w-3/4" />
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {products.map((product: any) => (
                        <Card key={product.id} className="overflow-hidden">
                          <div className="aspect-square relative">
                            <Image
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              width={200}
                              height={200}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-medium">{product.name}</h3>
                            <div className="flex items-center gap-1 py-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= Math.floor(product.rating)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-gray-500">({product.reviews})</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">${product.price.toFixed(2)}</span>
                              <Button size="sm" variant="outline">
                                View
                              </Button>
                            </div>
                            {product.tags && product.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {product.tags.slice(0, 2).map((tag: string) => (
                                  <span key={tag} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No products found matching your criteria.</p>
                      <Button onClick={resetFilters} variant="outline" className="mt-4">
                        Reset Filters
                      </Button>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalProducts > limit && (
                    <div className="flex items-center justify-center gap-2 pt-6">
                      <Button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || isLoading}
                        variant="outline"
                        size="sm"
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {Math.ceil(totalProducts / limit)}
                      </span>
                      <Button
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        disabled={currentPage >= Math.ceil(totalProducts / limit) || isLoading}
                        variant="outline"
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl mb-4">AI-Powered Recommendations</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[7, 8, 9].map((i) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="aspect-square relative">
                        <Image
                          src={`/placeholder.svg?height=200&width=200&text=Product+${i}`}
                          alt={`Product ${i}`}
                          width={200}
                          height={200}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium">Product Name {i}</h3>
                        <div className="flex items-center gap-1 py-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${star <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                          <span className="text-xs text-gray-500">(12)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">${(i * 15.5).toFixed(2)}</span>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced-filters">
              <AdvancedFilters />
            </TabsContent>

            <TabsContent value="merchandising">
              <AdvancedMerchandising />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  )
}
