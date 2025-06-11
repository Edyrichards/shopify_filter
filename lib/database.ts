import { mockDb } from "./database/mock-db"

export interface DatabaseConnection {
  isConnected: boolean
  lastChecked: Date
  error?: string
}

export class DatabaseService {
  private static instance: DatabaseService
  private connectionStatus: DatabaseConnection = {
    isConnected: false,
    lastChecked: new Date(),
  }

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async checkConnection(): Promise<DatabaseConnection> {
    try {
      const result = await mockDb.checkConnection()
      this.connectionStatus = {
        isConnected: result.isConnected,
        lastChecked: new Date(),
        error: result.isConnected ? undefined : result.message,
      }
    } catch (error) {
      this.connectionStatus = {
        isConnected: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : "Unknown database error",
      }
    }

    return this.connectionStatus
  }

  getConnectionStatus(): DatabaseConnection {
    return this.connectionStatus
  }

  async executeQuery<T>(query: string, params: any[] = []): Promise<T[]> {
    // Mock implementation
    console.log("Mock query execution:", query, params)
    return [] as T[]
  }

  async transaction<T>(operations: ((db: any) => Promise<T>)[]): Promise<T[]> {
    // Mock implementation
    const results: T[] = []
    for (const operation of operations) {
      try {
        const result = await operation(mockDb)
        results.push(result)
      } catch (error) {
        console.error("Mock transaction error:", error)
        throw error
      }
    }
    return results
  }

  async cleanup(): Promise<void> {
    // Nothing to clean up in mock implementation
  }
}

export const databaseService = DatabaseService.getInstance()

// Health check function for API routes
export async function checkDatabaseHealth(): Promise<{
  status: "healthy" | "unhealthy"
  message: string
  timestamp: string
}> {
  try {
    const connection = await databaseService.checkConnection()

    return {
      status: connection.isConnected ? "healthy" : "unhealthy",
      message: connection.error || "Database connection successful",
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }
  }
}

// Export the mock database for direct access
export const db = mockDb
