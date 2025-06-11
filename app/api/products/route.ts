import { NextResponse } from "next/server"
import { filterProducts, type FilterOptions, type ProductSearchResponse } from "@/lib/product-filter"

// Enhanced mock product data
const products = [
  {
    id: 1,
    name: "Classic T-Shirt",
    price: 19.99,
    category: "Clothing",
    tags: ["bestseller", "summer", "cotton"],
    image: "/placeholder.svg?height=200&width=200&text=T-Shirt",
    rating: 4.5,
    reviews: 24,
    variants: [
      { id: 101, color: "Black", size: "M", inventory: 10 },
      { id: 102, color: "White", size: "L", inventory: 5 },
      { id: 103, color: "Red", size: "S", inventory: 8 },
    ],
  },
  {
    id: 2,
    name: "Running Shoes",
    price: 89.99,
    category: "Shoes",
    tags: ["sports", "new", "breathable"],
    image: "/placeholder.svg?height=200&width=200&text=Shoes",
    rating: 4.8,
    reviews: 36,
    variants: [
      { id: 201, color: "Black", size: "42", inventory: 3 },
      { id: 202, color: "Blue", size: "43", inventory: 7 },
      { id: 203, color: "White", size: "44", inventory: 2 },
    ],
  },
  {
    id: 3,
    name: "Leather Wallet",
    price: 29.99,
    category: "Accessories",
    tags: ["leather", "gift", "premium"],
    image: "/placeholder.svg?height=200&width=200&text=Wallet",
    rating: 4.2,
    reviews: 18,
    variants: [
      { id: 301, color: "Brown", size: "One Size", inventory: 15 },
      { id: 302, color: "Black", size: "One Size", inventory: 12 },
    ],
  },
  {
    id: 4,
    name: "Summer Dress",
    price: 45.99,
    category: "Clothing",
    tags: ["summer", "casual", "cotton"],
    image: "/placeholder.svg?height=200&width=200&text=Dress",
    rating: 4.6,
    reviews: 42,
    variants: [
      { id: 401, color: "Blue", size: "S", inventory: 6 },
      { id: 402, color: "White", size: "M", inventory: 4 },
      { id: 403, color: "Pink", size: "L", inventory: 8 },
    ],
  },
  {
    id: 5,
    name: "Winter Jacket",
    price: 129.99,
    category: "Clothing",
    tags: ["winter", "warm", "waterproof"],
    image: "/placeholder.svg?height=200&width=200&text=Jacket",
    rating: 4.7,
    reviews: 28,
    variants: [
      { id: 501, color: "Navy", size: "M", inventory: 3 },
      { id: 502, color: "Black", size: "L", inventory: 2 },
      { id: 503, color: "Gray", size: "XL", inventory: 5 },
    ],
  },
  {
    id: 6,
    name: "Leather Boots",
    price: 159.99,
    category: "Shoes",
    tags: ["leather", "winter", "durable"],
    image: "/placeholder.svg?height=200&width=200&text=Boots",
    rating: 4.4,
    reviews: 31,
    variants: [
      { id: 601, color: "Brown", size: "41", inventory: 4 },
      { id: 602, color: "Black", size: "42", inventory: 6 },
      { id: 603, color: "Tan", size: "43", inventory: 3 },
    ],
  },
  {
    id: 7,
    name: "Cotton Polo",
    price: 34.99,
    category: "Clothing",
    tags: ["cotton", "casual", "bestseller"],
    image: "/placeholder.svg?height=200&width=200&text=Polo",
    rating: 4.3,
    reviews: 19,
    variants: [
      { id: 701, color: "Navy", size: "M", inventory: 12 },
      { id: 702, color: "White", size: "L", inventory: 8 },
      { id: 703, color: "Green", size: "S", inventory: 6 },
    ],
  },
  {
    id: 8,
    name: "Premium Watch",
    price: 299.99,
    category: "Accessories",
    tags: ["premium", "gift", "luxury"],
    image: "/placeholder.svg?height=200&width=200&text=Watch",
    rating: 4.9,
    reviews: 15,
    variants: [
      { id: 801, color: "Silver", size: "One Size", inventory: 2 },
      { id: 802, color: "Gold", size: "One Size", inventory: 1 },
      { id: 803, color: "Black", size: "One Size", inventory: 3 },
    ],
  },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract query parameters with defaults
    const filterOptions: FilterOptions = {
      category: searchParams.get("category"),
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      search: searchParams.get("search"),
      tags: searchParams
        .get("tags")
        ?.split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      sort: searchParams.get("sort") as "price_asc" | "price_desc" | "name_asc" | "name_desc" | "rating_desc" | null,
      offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : 0,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 10,
    }

    // Use the helper function to filter products
    const result: ProductSearchResponse = filterProducts(products, filterOptions)

    // Add current query params to response for frontend use
    const currentParams = Object.fromEntries(searchParams.entries())

    return NextResponse.json({
      ...result,
      queryParams: currentParams,
    })
  } catch (error) {
    console.error("Error in products API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
