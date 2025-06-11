// Retry mechanism for failed operations
export interface RetryOptions {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffFactor: number
  retryableErrors?: (error: Error) => boolean
}

const defaultRetryOptions: RetryOptions = {
  maxRetries: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  retryableErrors: () => true, // By default, retry all errors
}

export async function withRetry<T>(operation: () => Promise<T>, options: Partial<RetryOptions> = {}): Promise<T> {
  const retryOptions = { ...defaultRetryOptions, ...options }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if we should retry this error
      if (!retryOptions.retryableErrors || !retryOptions.retryableErrors(lastError)) {
        throw lastError
      }

      // If we've reached max retries, throw the last error
      if (attempt >= retryOptions.maxRetries) {
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryOptions.initialDelay * Math.pow(retryOptions.backoffFactor, attempt),
        retryOptions.maxDelay,
      )

      console.log(`Retry attempt ${attempt + 1}/${retryOptions.maxRetries} after ${delay}ms`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // This should never happen due to the throw in the loop
  throw lastError || new Error("Unknown error in retry mechanism")
}
