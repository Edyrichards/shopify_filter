"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

export default function InstallErrorPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get("message") || "unknown_error"

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "installation_failed":
        return "The installation process failed. This could be due to a network issue or temporary problem with Shopify."
      case "invalid_shop":
        return "The shop domain provided is invalid or not accessible."
      case "permission_denied":
        return "The installation was cancelled or permission was denied."
      case "session_expired":
        return "The installation session has expired. Please try again."
      default:
        return "An unexpected error occurred during installation."
    }
  }

  const getErrorTitle = (errorCode: string) => {
    switch (errorCode) {
      case "installation_failed":
        return "Installation Failed"
      case "invalid_shop":
        return "Invalid Shop"
      case "permission_denied":
        return "Permission Denied"
      case "session_expired":
        return "Session Expired"
      default:
        return "Installation Error"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 rounded-full bg-red-100 p-3 w-16 h-16 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">{getErrorTitle(message)}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{getErrorMessage(message)}</AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button onClick={() => (window.location.href = "/install")} className="w-full" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Button onClick={() => (window.location.href = "/")} className="w-full" variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>

          <div className="border-t pt-4 text-center">
            <p className="text-sm text-gray-600 mb-2">Need help? Contact our support team:</p>
            <Button variant="link" className="text-sm">
              support@boostaisearch.com
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Error Code: {message}</p>
            <p>Time: {new Date().toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
