"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Tag, Settings, Palette, Star } from "lucide-react"

interface FilterState {
  categories: string[]
  tags: string[]
  colors: string[]
  sizes: string[]
  priceRange: [number, number]
  rating: number
  metafields: Record<string, string[]>
  variants: Record<string, string[]>
}

interface AdvancedFiltersProps {
  onFiltersChange?: (filters: FilterState) => void
  initialFilters?: Partial<FilterState>
}

export default function AdvancedFilters({ onFiltersChange, initialFilters }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    tags: [],
    colors: [],
    sizes: [],
    priceRange: [0, 500],
    rating: 0,
    metafields: {},
    variants: {},
    ...initialFilters,
  })

  const [availableOptions, setAvailableOptions] = useState({
    categories: ["Clothing", "Shoes", "Accessories", "Electronics"],
    tags: ["bestseller", "new-arrival", "sale", "limited-edition", "eco-friendly"],
    colors: [
      { name: "Black", value: "black", color: "bg-black" },
      { name: "White", value: "white", color: "bg-white border" },
      { name: "Red", value: "red", color: "bg-red-500" },
      { name: "Blue", value: "blue", color: "bg-blue-500" },
      { name: "Green", value: "green", color: "bg-green-500" },
      { name: "Yellow", value: "yellow", color: "bg-yellow-500" },
      { name: "Purple", value: "purple", color: "bg-purple-500" },
      { name: "Pink", value: "pink", color: "bg-pink-500" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    metafields: [
      { namespace: "custom", key: "material", values: ["Cotton", "Polyester", "Silk", "Wool"] },
      { namespace: "custom", key: "season", values: ["Spring", "Summer", "Fall", "Winter"] },
      { namespace: "sustainability", key: "certifications", values: ["Organic", "Recycled", "Fair Trade"] },
    ],
    variants: [
      { option: "fit", values: ["Slim", "Regular", "Loose", "Oversized"] },
      { option: "style", values: ["Casual", "Formal", "Sport", "Vintage"] },
    ],
  })

  const [customRules, setCustomRules] = useState([
    { field: "tag", condition: "contains", value: "sale", action: "Show in Sale filter" },
    { field: "price", condition: "greater", value: "100", action: "Show in Premium filter" },
  ])

  // Notify parent component when filters change
  useEffect(() => {
    onFiltersChange?.(filters)
  }, [filters, onFiltersChange])

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const toggleArrayFilter = <K extends keyof Pick<FilterState, "categories" | "tags" | "colors" | "sizes">>(
    key: K,
    value: string,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((item) => item !== value) : [...prev[key], value],
    }))
  }

  const updateMetafield = (namespace: string, key: string, values: string[]) => {
    setFilters((prev) => ({
      ...prev,
      metafields: {
        ...prev.metafields,
        [`${namespace}.${key}`]: values,
      },
    }))
  }

  const updateVariant = (option: string, values: string[]) => {
    setFilters((prev) => ({
      ...prev,
      variants: {
        ...prev.variants,
        [option]: values,
      },
    }))
  }

  const resetFilters = () => {
    setFilters({
      categories: [],
      tags: [],
      colors: [],
      sizes: [],
      priceRange: [0, 500],
      rating: 0,
      metafields: {},
      variants: {},
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Advanced Filters</h2>
        <Button onClick={resetFilters} variant="outline" size="sm">
          Reset All
        </Button>
      </div>

      <Tabs defaultValue="standard">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="standard">Standard Filters</TabsTrigger>
          <TabsTrigger value="metafields">Metafields</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="custom">Custom Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="standard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {availableOptions.categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={filters.categories.includes(category)}
                      onCheckedChange={() => toggleArrayFilter("categories", category)}
                    />
                    <Label htmlFor={category} className="text-sm">
                      {category}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Color
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {availableOptions.colors.map((color) => (
                    <div
                      key={color.value}
                      className={`h-8 w-8 rounded cursor-pointer ${color.color} ${
                        filters.colors.includes(color.value) ? "ring-2 ring-blue-500" : ""
                      }`}
                      title={color.name}
                      onClick={() => toggleArrayFilter("colors", color.value)}
                    />
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {filters.colors.map((color) => (
                    <Badge key={color} variant="secondary" className="text-xs">
                      {availableOptions.colors.find((c) => c.value === color)?.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {availableOptions.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={filters.sizes.includes(size) ? "default" : "outline"}
                      size="sm"
                      className="h-8"
                      onClick={() => toggleArrayFilter("sizes", size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Price Range</CardTitle>
              </CardHeader>
              <CardContent>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilter("priceRange", value as [number, number])}
                  max={500}
                  step={10}
                  className="py-4"
                />
                <div className="flex items-center justify-between text-sm">
                  <span>${filters.priceRange[0]}</span>
                  <span>${filters.priceRange[1]}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={filters.rating.toString()}
                  onValueChange={(value) => updateFilter("rating", Number.parseInt(value))}
                >
                  {[4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                      <Label htmlFor={`rating-${rating}`} className="flex items-center text-sm">
                        {Array.from({ length: rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                        {Array.from({ length: 5 - rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-gray-300" />
                        ))}
                        <span className="ml-1">& up</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {availableOptions.tags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={tag}
                      checked={filters.tags.includes(tag)}
                      onCheckedChange={() => toggleArrayFilter("tags", tag)}
                    />
                    <Label htmlFor={tag} className="text-sm">
                      {tag}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metafields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Metafield Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {availableOptions.metafields.map((metafield) => (
                  <div key={`${metafield.namespace}.${metafield.key}`} className="space-y-3">
                    <h4 className="font-medium capitalize">
                      {metafield.key} ({metafield.namespace})
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {metafield.values.map((value) => (
                        <div key={value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${metafield.namespace}-${metafield.key}-${value}`}
                            checked={
                              filters.metafields[`${metafield.namespace}.${metafield.key}`]?.includes(value) || false
                            }
                            onCheckedChange={(checked) => {
                              const currentValues = filters.metafields[`${metafield.namespace}.${metafield.key}`] || []
                              const newValues = checked
                                ? [...currentValues, value]
                                : currentValues.filter((v) => v !== value)
                              updateMetafield(metafield.namespace, metafield.key, newValues)
                            }}
                          />
                          <Label htmlFor={`${metafield.namespace}-${metafield.key}-${value}`} className="text-sm">
                            {value}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Variant-based Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {availableOptions.variants.map((variant) => (
                  <div key={variant.option} className="space-y-3">
                    <h4 className="font-medium capitalize">{variant.option}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {variant.values.map((value) => (
                        <div key={value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${variant.option}-${value}`}
                            checked={filters.variants[variant.option]?.includes(value) || false}
                            onCheckedChange={(checked) => {
                              const currentValues = filters.variants[variant.option] || []
                              const newValues = checked
                                ? [...currentValues, value]
                                : currentValues.filter((v) => v !== value)
                              updateVariant(variant.option, newValues)
                            }}
                          />
                          <Label htmlFor={`${variant.option}-${value}`} className="text-sm">
                            {value}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Custom Filter Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Create Custom Rule</h4>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tag">Tag</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                        <SelectItem value="type">Product Type</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="greater">Greater than</SelectItem>
                        <SelectItem value="less">Less than</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Value" />
                    <Button>Add Rule</Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Active Custom Rules</h4>
                  <div className="space-y-2">
                    {customRules.map((rule, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">
                          {rule.field} {rule.condition} "{rule.value}" → {rule.action}
                        </span>
                        <Button size="sm" variant="outline">
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Active Filters Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Active Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {filters.categories.map((category) => (
              <Badge key={category} variant="secondary">
                Category: {category}
              </Badge>
            ))}
            {filters.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                Tag: {tag}
              </Badge>
            ))}
            {filters.colors.map((color) => (
              <Badge key={color} variant="secondary">
                Color: {availableOptions.colors.find((c) => c.value === color)?.name}
              </Badge>
            ))}
            {filters.sizes.map((size) => (
              <Badge key={size} variant="secondary">
                Size: {size}
              </Badge>
            ))}
            {filters.priceRange[0] > 0 || filters.priceRange[1] < 500 ? (
              <Badge variant="secondary">
                Price: ${filters.priceRange[0]} - ${filters.priceRange[1]}
              </Badge>
            ) : null}
            {filters.rating > 0 && <Badge variant="secondary">Rating: {filters.rating}+ stars</Badge>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
