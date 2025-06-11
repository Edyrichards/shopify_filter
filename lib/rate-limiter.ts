// Implement rate limiting for API calls
export interface RateLimitOptions {
  maxRequests: number
  windowMs: number
  keyGenerator?: (req: Request) => string
}

export class RateLimiter {
  private windowMs: number
  private maxRequests: number
  private keyGenerator: (req: Request) => string
  private store: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs
    this.maxRequests = options.maxRequests
    this.keyGenerator =
      options.keyGenerator ||
      ((req) => {
        // Default to IP address
        const forwarded = req.headers.get("x-forwarded-for")
        const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
        return ip
      })
  }

  async limit(req: Request): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
    const key = this.keyGenerator(req)
    const now = Date.now()

    // Get or create record
    let record = this.store.get(key)

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + this.windowMs }
      this.store.set(key, record)
    }

    // Increment count
    record.count++

    // Check if over limit
    const limited = record.count > this.maxRequests
    const remaining = Math.max(0, this.maxRequests - record.count)

    return { limited, remaining, resetTime: record.resetTime }
  }

  // Clean up expired records periodically
  startCleanup(interval = 60000): () => void {
    const timer = setInterval(() => {
      const now = Date.now()
      for (const [key, record] of this.store.entries()) {
        if (now > record.resetTime) {
          this.store.delete(key)
        }
      }
    }, interval)

    // Return cleanup function
    return () => clearInterval(timer)
  }
}
