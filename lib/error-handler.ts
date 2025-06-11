// Comprehensive error handling system
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface ErrorDetails {
  message: string
  code?: string
  stack?: string
  context?: Record<string, any>
  timestamp: Date
  severity: ErrorSeverity
}

export class ErrorTracker {
  private static instance: ErrorTracker
  private errors: ErrorDetails[] = []
  private errorHandlers: ((error: ErrorDetails) => void)[] = []

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker()
    }
    return ErrorTracker.instance
  }

  trackError(error: Error, severity: ErrorSeverity = ErrorSeverity.MEDIUM, context?: Record<string, any>): void {
    const errorDetails: ErrorDetails = {
      message: error.message,
      code: (error as any).code,
      stack: error.stack,
      context,
      timestamp: new Date(),
      severity,
    }

    this.errors.push(errorDetails)

    // Notify all registered handlers
    this.errorHandlers.forEach((handler) => {
      try {
        handler(errorDetails)
      } catch (e) {
        console.error("Error in error handler:", e)
      }
    })

    // Log to console
    console.error(`[${severity.toUpperCase()}] ${error.message}`, context)

    // For critical errors, send alerts
    if (severity === ErrorSeverity.CRITICAL) {
      this.sendAlert(errorDetails)
    }
  }

  onError(handler: (error: ErrorDetails) => void): () => void {
    this.errorHandlers.push(handler)

    // Return unsubscribe function
    return () => {
      this.errorHandlers = this.errorHandlers.filter((h) => h !== handler)
    }
  }

  getRecentErrors(limit = 100): ErrorDetails[] {
    return [...this.errors].reverse().slice(0, limit)
  }

  private async sendAlert(error: ErrorDetails): Promise<void> {
    // In production, send to monitoring service like Sentry, LogRocket, etc.
    try {
      await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(error),
      })
    } catch (e) {
      console.error("Failed to send alert:", e)
    }
  }
}

export const errorTracker = ErrorTracker.getInstance()

// Utility function to safely execute async functions with error tracking
export async function safeExecute<T>(
  fn: () => Promise<T>,
  errorMessage: string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context?: Record<string, any>,
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    errorTracker.trackError(error instanceof Error ? error : new Error(errorMessage), severity, context)
    return null
  }
}
