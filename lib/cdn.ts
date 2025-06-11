interface CDNConfig {
  baseUrl: string
  apiKey?: string
  enabled: boolean
}

interface CDNAsset {
  key: string
  url: string
  contentType: string
  size: number
  lastModified: Date
}

class CDNService {
  private config: CDNConfig
  private cache: Map<string, string> = new Map()

  constructor() {
    this.config = {
      baseUrl: process.env.CDN_BASE_URL || "",
      apiKey: process.env.CDN_API_KEY,
      enabled: !!process.env.CDN_BASE_URL,
    }
  }

  async uploadAsset(key: string, data: Buffer, contentType: string): Promise<string> {
    if (!this.config.enabled) {
      throw new Error("CDN is not configured")
    }

    try {
      // For demo purposes, we'll simulate upload
      // In production, this would upload to your CDN provider
      const url = `${this.config.baseUrl}/${key}`

      // Cache the URL
      this.cache.set(key, url)

      console.log(`Asset uploaded: ${key} -> ${url}`)
      return url
    } catch (error) {
      console.error("Failed to upload asset:", error)
      throw error
    }
  }

  async getAssetUrl(key: string): Promise<string | null> {
    // Check cache first
    const cachedUrl = this.cache.get(key)
    if (cachedUrl) {
      return cachedUrl
    }

    if (!this.config.enabled) {
      return null
    }

    // In production, this would check if the asset exists on CDN
    const url = `${this.config.baseUrl}/${key}`
    this.cache.set(key, url)
    return url
  }

  async deleteAsset(key: string): Promise<boolean> {
    if (!this.config.enabled) {
      return false
    }

    try {
      // Remove from cache
      this.cache.delete(key)

      console.log(`Asset deleted: ${key}`)
      return true
    } catch (error) {
      console.error("Failed to delete asset:", error)
      return false
    }
  }

  async listAssets(): Promise<CDNAsset[]> {
    if (!this.config.enabled) {
      return []
    }

    // Mock asset list for demo
    return [
      {
        key: "search-widget.js",
        url: `${this.config.baseUrl}/search-widget.js`,
        contentType: "application/javascript",
        size: 15420,
        lastModified: new Date(),
      },
      {
        key: "search-widget.css",
        url: `${this.config.baseUrl}/search-widget.css`,
        contentType: "text/css",
        size: 8930,
        lastModified: new Date(),
      },
    ]
  }

  generateSignedUrl(key: string, expiresIn = 3600): string {
    if (!this.config.enabled) {
      throw new Error("CDN is not configured")
    }

    // For demo purposes, return a simple URL
    // In production, this would generate a signed URL with expiration
    const baseUrl = `${this.config.baseUrl}/${key}`
    const expires = Date.now() + expiresIn * 1000

    return `${baseUrl}?expires=${expires}`
  }

  isEnabled(): boolean {
    return this.config.enabled
  }

  getConfig(): Omit<CDNConfig, "apiKey"> {
    return {
      baseUrl: this.config.baseUrl,
      enabled: this.config.enabled,
    }
  }
}

// Export singleton instance
export const cdn = new CDNService()

// Export types
export type { CDNConfig, CDNAsset }
