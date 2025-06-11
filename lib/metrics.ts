// Implement metrics tracking for monitoring
export interface Metric {
  name: string
  value: number
  tags: Record<string, string>
  timestamp: Date
}

export class MetricsCollector {
  private static instance: MetricsCollector
  private metrics: Metric[] = []
  private flushInterval: ReturnType<typeof setInterval> | null = null

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector()
    }
    return MetricsCollector.instance
  }

  track(name: string, value: number, tags: Record<string, string> = {}): void {
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: new Date(),
    })
  }

  increment(name: string, tags: Record<string, string> = {}): void {
    this.track(name, 1, tags)
  }

  decrement(name: string, tags: Record<string, string> = {}): void {
    this.track(name, -1, tags)
  }

  timing(name: string, startTime: number, tags: Record<string, string> = {}): void {
    const duration = Date.now() - startTime
    this.track(name, duration, tags)
  }

  // Start automatic flushing of metrics
  startFlushing(intervalMs = 60000): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }

    this.flushInterval = setInterval(() => {
      this.flush().catch((err) => console.error("Error flushing metrics:", err))
    }, intervalMs)
  }

  stopFlushing(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }

  async flush(): Promise<void> {
    if (this.metrics.length === 0) return

    const metricsToSend = [...this.metrics]
    this.metrics = []

    try {
      // In production, send to a metrics service like Datadog, Prometheus, etc.
      await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: metricsToSend }),
      })
    } catch (error) {
      console.error("Failed to flush metrics:", error)
      // Put metrics back in the queue
      this.metrics = [...metricsToSend, ...this.metrics]
    }
  }

  // Get current metrics for display
  getMetrics(): Metric[] {
    return [...this.metrics]
  }
}

export const metrics = MetricsCollector.getInstance()

// Start flushing metrics automatically
if (typeof window !== "undefined") {
  metrics.startFlushing()
}
