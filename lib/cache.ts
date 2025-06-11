interface CacheConfig {
  ttl: number // Time to live in seconds
  maxSize: number // Maximum number of items
}

interface CacheItem<T> {
  value: T
  expires: number
  created: number
}

class CacheService<T = any> {
  private cache = new Map<string, CacheItem<T>>()
  private config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: config.ttl || 3600, // 1 hour default
      maxSize: config.maxSize || 1000,
    }

    // Clean up expired items periodically
    setInterval(() => {
      this.cleanup()
    }, 60000) // Every minute
  }

  set(key: string, value: T, ttl?: number): void {
    const expires = Date.now() + (ttl || this.config.ttl) * 1000

    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.getOldestKey()
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      value,
      expires,
      created: Date.now(),
    })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  private getOldestKey(): string | null {
    let oldestKey: string | null = null
    let oldestTime = Number.POSITIVE_INFINITY

    for (const [key, item] of this.cache.entries()) {
      if (item.created < oldestTime) {
        oldestTime = item.created
        oldestKey = key
      }
    }

    return oldestKey
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => {
      this.cache.delete(key)
    })
  }

  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    memoryUsage: number
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // Would need to track hits/misses for real implementation
      memoryUsage: 0, // Would need to calculate actual memory usage
    }
  }
}

// Create singleton instances for different cache types
export const searchCache = new CacheService({ ttl: 300, maxSize: 500 }) // 5 minutes
export const productCache = new CacheService({ ttl: 1800, maxSize: 1000 }) // 30 minutes
export const userCache = new CacheService({ ttl: 3600, maxSize: 200 }) // 1 hour

export { CacheService }
export type { CacheConfig, CacheItem }
