"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { getShopifyAdminUrl } from "@/app/actions/shopify-actions"

export default function InstallPage() {
  const [shopDomain, setShopDomain] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isValidDomain, setIsValidDomain] = useState(false)

  // Validate shop domain format
  useEffect(() => {
    if (!shopDomain) {
      setIsValidDomain(false)
      return
    }

    const shopDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/
    setIsValidDomain(shopDomainRegex.test(shopDomain))
  }, [shopDomain])

  const handleInstall = async () => {
    if (!isValidDomain) {
      setError("Please enter a valid Shopify domain (e.g., yourstore.myshopify.com)")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Check if already installed
      const checkResponse = await fetch("/api/shopify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop: shopDomain, action: "check_installation" }),
      })

      const checkData = await checkResponse.json()

      if (checkData.installed) {
        // Already installed, redirect to app using server action
        const { url } = await getShopifyAdminUrl(shopDomain)
        window.location.href = url
        return
      }

      // Start installation process
      window.location.href = `/api/shopify?shop=${shopDomain}`
    } catch (error) {
      console.error("Installation error:", error)
      setError("Failed to start installation. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toLowerCase().trim()

    // Auto-add .myshopify.com if not present
    if (value && !value.includes(".myshopify.com") && !value.includes(".")) {
      value = `${value}.myshopify.com`
    }

    setShopDomain(value)
    setError("")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 rounded-full bg-red-500 p-3 w-16 h-16 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-8 w-8">
              <path d="M18.031 16.617l4.283 4.282-1.415 1.415-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9 9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.868-3.133-7-7-7-3.868 0-7 3.132-7 7 0 3.867 3.132 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15z" />
            </svg>
          </div>
          <CardTitle className="text-2xl">Install Boost AI Search & Filter</CardTitle>
          <p className="text-gray-600">Enter your Shopify store domain to get started</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="shop-domain" className="text-sm font-medium">
              Shopify Store Domain
            </label>
            <div className="relative">
              <Input
                id="shop-domain"
                type="text"
                placeholder="yourstore.myshopify.com"
                value={shopDomain}
                onChange={handleDomainChange}
                className={`pr-10 ${isValidDomain ? "border-green-500" : shopDomain ? "border-red-500" : ""}`}
              />
              {shopDomain && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isValidDomain ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {shopDomain && !isValidDomain && (
              <p className="text-sm text-red-600">
                Please enter a valid Shopify domain (e.g., yourstore.myshopify.com)
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleInstall}
            disabled={!isValidDomain || isLoading}
            className="w-full bg-red-500 hover:bg-red-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Installing...
              </>
            ) : (
              "Install App"
            )}
          </Button>

          <div className="text-center text-sm text-gray-500">
            <p>By installing, you agree to our Terms of Service and Privacy Policy</p>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">What you'll get:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                AI-powered product search
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Advanced filtering options
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Real-time inventory sync
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Analytics and insights
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
