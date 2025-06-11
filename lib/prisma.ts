// Mock Prisma client for build compatibility
// This file provides the required exports without actual Prisma functionality

interface MockPrismaClient {
  $connect(): Promise<void>
  $disconnect(): Promise<void>
  $queryRaw(query: any, ...args: any[]): Promise<any>
  $queryRawUnsafe(query: string, ...args: any[]): Promise<any>
  $transaction(operations: any[]): Promise<any[]>
  [key: string]: any
}

class MockPrismaClient implements MockPrismaClient {
  async $connect(): Promise<void> {
    console.log("Mock Prisma: Connected")
  }

  async $disconnect(): Promise<void> {
    console.log("Mock Prisma: Disconnected")
  }

  async $queryRaw(query: any, ...args: any[]): Promise<any> {
    console.log("Mock Prisma: Query executed", query, args)
    return []
  }

  async $queryRawUnsafe(query: string, ...args: any[]): Promise<any> {
    console.log("Mock Prisma: Unsafe query executed", query, args)
    return []
  }

  async $transaction(operations: any[]): Promise<any[]> {
    console.log("Mock Prisma: Transaction executed", operations.length, "operations")
    return []
  }

  // Mock table accessors
  get shop() {
    return {
      create: async (data: any) => ({ id: "mock-id", ...data.data }),
      findUnique: async (query: any) => null,
      findMany: async (query: any) => [],
      update: async (query: any) => ({ id: "mock-id", ...query.data }),
      delete: async (query: any) => ({ id: "mock-id" }),
      upsert: async (query: any) => ({ id: "mock-id", ...query.create }),
    }
  }

  get shopSettings() {
    return {
      create: async (data: any) => ({ id: "mock-id", ...data.data }),
      findUnique: async (query: any) => null,
      findMany: async (query: any) => [],
      update: async (query: any) => ({ id: "mock-id", ...query.data }),
      delete: async (query: any) => ({ id: "mock-id" }),
      upsert: async (query: any) => ({ id: "mock-id", ...query.create }),
    }
  }

  get product() {
    return {
      create: async (data: any) => ({ id: "mock-id", ...data.data }),
      findUnique: async (query: any) => null,
      findMany: async (query: any) => [],
      update: async (query: any) => ({ id: "mock-id", ...query.data }),
      delete: async (query: any) => ({ id: "mock-id" }),
      upsert: async (query: any) => ({ id: "mock-id", ...query.create }),
    }
  }

  get searchLog() {
    return {
      create: async (data: any) => ({ id: "mock-id", ...data.data }),
      findUnique: async (query: any) => null,
      findMany: async (query: any) => [],
      update: async (query: any) => ({ id: "mock-id", ...query.data }),
      delete: async (query: any) => ({ id: "mock-id" }),
      upsert: async (query: any) => ({ id: "mock-id", ...query.create }),
    }
  }

  get syncLog() {
    return {
      create: async (data: any) => ({ id: "mock-id", ...data.data }),
      findUnique: async (query: any) => null,
      findMany: async (query: any) => [],
      update: async (query: any) => ({ id: "mock-id", ...query.data }),
      delete: async (query: any) => ({ id: "mock-id" }),
      upsert: async (query: any) => ({ id: "mock-id", ...query.create }),
    }
  }
}

// Create a singleton instance
const mockPrismaClient = new MockPrismaClient()

// Global for development to prevent multiple instances
const globalForPrisma = global as unknown as { prisma: MockPrismaClient }

// Export the mock client as both named and default export
export const prisma = globalForPrisma.prisma || mockPrismaClient

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

// Default export
export default prisma
