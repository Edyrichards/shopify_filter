interface MonitoringRule {
  id: string
  name: string
  metric: string
  threshold: number
  operator: "gt" | "lt" | "eq"
  timeWindow: number
  severity: "critical" | "warning" | "info"
  enabled: boolean
}

interface Alert {
  id: string
  ruleId: string
  message: string
  severity: "critical" | "warning" | "info"
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
}

class MonitoringService {
  private rules: Map<string, MonitoringRule> = new Map()
  private alerts: Map<string, Alert> = new Map()
  private checkInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeDefaultRules()
    this.startMonitoring()
  }

  private initializeDefaultRules() {
    const defaultRules: MonitoringRule[] = [
      {
        id: "high-response-time",
        name: "High Response Time",
        metric: "response_time",
        threshold: 2000,
        operator: "gt",
        timeWindow: 300000, // 5 minutes
        severity: "warning",
        enabled: true,
      },
      {
        id: "high-error-rate",
        name: "High Error Rate",
        metric: "error_rate",
        threshold: 0.05,
        operator: "gt",
        timeWindow: 300000,
        severity: "critical",
        enabled: true,
      },
      {
        id: "low-memory",
        name: "Low Memory",
        metric: "memory_usage",
        threshold: 0.9,
        operator: "gt",
        timeWindow: 60000, // 1 minute
        severity: "warning",
        enabled: true,
      },
    ]

    defaultRules.forEach((rule) => {
      this.rules.set(rule.id, rule)
    })
  }

  private startMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.checkInterval = setInterval(() => {
      this.checkRules()
    }, 30000) // Check every 30 seconds
  }

  private async checkRules() {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue

      try {
        const shouldAlert = await this.evaluateRule(rule)
        if (shouldAlert) {
          await this.createAlert(rule)
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error)
      }
    }
  }

  private async evaluateRule(rule: MonitoringRule): Promise<boolean> {
    const now = Date.now()
    const startTime = now - rule.timeWindow

    // Get metric data for the time window
    const metricData = await this.getMetricData(rule.metric, startTime, now)

    if (metricData.length === 0) return false

    // Calculate average value
    const average = metricData.reduce((sum, value) => sum + value, 0) / metricData.length

    // Evaluate condition
    switch (rule.operator) {
      case "gt":
        return average > rule.threshold
      case "lt":
        return average < rule.threshold
      case "eq":
        return Math.abs(average - rule.threshold) < 0.001
      default:
        return false
    }
  }

  private async getMetricData(metric: string, startTime: number, endTime: number): Promise<number[]> {
    // Simple in-memory metric storage for demo
    // In production, this would query your metrics database
    const mockData: Record<string, number[]> = {
      response_time: [1500, 1800, 2200, 1900, 2100],
      error_rate: [0.02, 0.03, 0.06, 0.04, 0.05],
      memory_usage: [0.7, 0.75, 0.8, 0.85, 0.92],
    }

    return mockData[metric] || []
  }

  private async createAlert(rule: MonitoringRule) {
    const alertId = `${rule.id}-${Date.now()}`

    // Check if similar alert already exists and is not resolved
    const existingAlert = Array.from(this.alerts.values()).find((alert) => alert.ruleId === rule.id && !alert.resolved)

    if (existingAlert) {
      return // Don't create duplicate alerts
    }

    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      message: `${rule.name}: Threshold ${rule.threshold} ${rule.operator} exceeded`,
      severity: rule.severity,
      timestamp: new Date(),
      resolved: false,
    }

    this.alerts.set(alertId, alert)
    await this.sendAlert(alert)
  }

  private async sendAlert(alert: Alert) {
    try {
      // Send to Slack if webhook URL is configured
      const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
      if (slackWebhookUrl) {
        await fetch(slackWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: `🚨 ${alert.severity.toUpperCase()}: ${alert.message}`,
            attachments: [
              {
                color: alert.severity === "critical" ? "danger" : "warning",
                fields: [
                  {
                    title: "Severity",
                    value: alert.severity,
                    short: true,
                  },
                  {
                    title: "Time",
                    value: alert.timestamp.toISOString(),
                    short: true,
                  },
                ],
              },
            ],
          }),
        })
      }

      // Log to console
      console.log(`Alert: ${alert.message}`, {
        id: alert.id,
        severity: alert.severity,
        timestamp: alert.timestamp,
      })
    } catch (error) {
      console.error("Failed to send alert:", error)
    }
  }

  // Public methods for managing rules and alerts
  addRule(rule: Omit<MonitoringRule, "id">): string {
    const id = `rule-${Date.now()}`
    this.rules.set(id, { ...rule, id })
    return id
  }

  removeRule(id: string): boolean {
    return this.rules.delete(id)
  }

  updateRule(id: string, updates: Partial<MonitoringRule>): boolean {
    const rule = this.rules.get(id)
    if (!rule) return false

    this.rules.set(id, { ...rule, ...updates })
    return true
  }

  getRules(): MonitoringRule[] {
    return Array.from(this.rules.values())
  }

  getAlerts(resolved?: boolean): Alert[] {
    const alerts = Array.from(this.alerts.values())
    if (resolved !== undefined) {
      return alerts.filter((alert) => alert.resolved === resolved)
    }
    return alerts
  }

  resolveAlert(id: string): boolean {
    const alert = this.alerts.get(id)
    if (!alert) return false

    alert.resolved = true
    alert.resolvedAt = new Date()
    return true
  }

  getSystemHealth(): {
    status: "healthy" | "warning" | "critical"
    activeAlerts: number
    criticalAlerts: number
    lastCheck: Date
  } {
    const activeAlerts = this.getAlerts(false)
    const criticalAlerts = activeAlerts.filter((alert) => alert.severity === "critical")

    let status: "healthy" | "warning" | "critical" = "healthy"
    if (criticalAlerts.length > 0) {
      status = "critical"
    } else if (activeAlerts.length > 0) {
      status = "warning"
    }

    return {
      status,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      lastCheck: new Date(),
    }
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}

// Export singleton instance
export const monitoring = new MonitoringService()

// Export types
export type { MonitoringRule, Alert }
