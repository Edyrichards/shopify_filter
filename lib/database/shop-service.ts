import { mockDb } from "./mock-db"
import { encryptSensitiveData, decryptSensitiveData } from "../security"
import type { Shop, ShopSettings, InstallSession } from "../types"

class ShopService {
  async createShop(shopData: Omit<Shop, "id" | "installedAt" | "updatedAt">): Promise<Shop> {
    const encryptedToken = process.env.ENCRYPTION_KEY
      ? encryptSensitiveData(shopData.accessToken, process.env.ENCRYPTION_KEY)
      : shopData.accessToken

    const shop = await mockDb.createShop({
      ...shopData,
      accessToken: encryptedToken,
    })

    // Create default settings
    await this.createDefaultSettings(shop.id)

    return shop as Shop
  }

  async getShopByDomain(shopDomain: string): Promise<Shop | null> {
    return mockDb.getShopByDomain(shopDomain) as Promise<Shop | null>
  }

  async updateShop(shopDomain: string, updates: Partial<Shop>): Promise<Shop | null> {
    return mockDb.updateShop(shopDomain, updates) as Promise<Shop | null>
  }

  async getDecryptedAccessToken(shopDomain: string): Promise<string | null> {
    const shop = await this.getShopByDomain(shopDomain)
    if (!shop) return null

    try {
      return process.env.ENCRYPTION_KEY
        ? decryptSensitiveData(shop.accessToken, process.env.ENCRYPTION_KEY)
        : shop.accessToken
    } catch (error) {
      console.error(`Failed to decrypt access token for ${shopDomain}:`, error)
      return null
    }
  }

  async deactivateShop(shopDomain: string): Promise<boolean> {
    const shop = await this.getShopByDomain(shopDomain)
    if (!shop) return false

    await this.updateShop(shopDomain, { isActive: false })
    return true
  }

  // Install session management
  async createInstallSession(
    sessionData: Omit<InstallSession, "id" | "createdAt" | "expiresAt">,
  ): Promise<InstallSession> {
    const session: InstallSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      ...sessionData,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    }

    return session
  }

  async getInstallSession(sessionId: string): Promise<InstallSession | null> {
    // Mock implementation
    return null
  }

  async completeInstallSession(sessionId: string): Promise<boolean> {
    // Mock implementation
    return true
  }

  // Shop settings management
  async createDefaultSettings(shopId: string): Promise<ShopSettings> {
    return mockDb.createDefaultSettings(shopId) as Promise<ShopSettings>
  }

  async getShopSettings(shopId: string): Promise<ShopSettings | null> {
    return mockDb.getShopSettings(shopId) as Promise<ShopSettings | null>
  }

  async updateShopSettings(shopId: string, updates: Partial<ShopSettings>): Promise<ShopSettings | null> {
    return mockDb.updateShopSettings(shopId, updates) as Promise<ShopSettings | null>
  }

  // Cleanup expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    // Mock implementation
  }
}

export const shopService = new ShopService()
