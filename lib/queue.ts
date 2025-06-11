// Implement a job queue system for better scalability
export interface Job<T = any> {
  id: string
  type: string
  data: T
  priority: number
  attempts: number
  maxAttempts: number
  createdAt: Date
  processedAt?: Date
  status: "pending" | "processing" | "completed" | "failed"
  result?: any
  error?: string
}

export class JobQueue {
  private static instance: JobQueue
  private queue: Job[] = []
  private processing = false
  private workers: Map<string, (job: Job) => Promise<any>> = new Map()

  static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue()
    }
    return JobQueue.instance
  }

  registerWorker<T>(jobType: string, worker: (job: Job<T>) => Promise<any>): void {
    this.workers.set(jobType, worker as (job: Job) => Promise<any>)
  }

  async addJob<T>(type: string, data: T, options: { priority?: number; maxAttempts?: number } = {}): Promise<string> {
    const { priority = 0, maxAttempts = 3 } = options

    const job: Job<T> = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      data,
      priority,
      attempts: 0,
      maxAttempts,
      createdAt: new Date(),
      status: "pending",
    }

    this.queue.push(job)

    // Sort queue by priority (higher number = higher priority)
    this.queue.sort((a, b) => b.priority - a.priority)

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue()
    }

    return job.id
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    try {
      const job = this.queue.shift()

      if (!job) {
        this.processing = false
        return
      }

      const worker = this.workers.get(job.type)

      if (!worker) {
        console.error(`No worker registered for job type: ${job.type}`)
        job.status = "failed"
        job.error = `No worker registered for job type: ${job.type}`
        this.processing = false
        return
      }

      job.status = "processing"
      job.attempts++

      try {
        job.processedAt = new Date()
        job.result = await worker(job)
        job.status = "completed"
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error)

        if (job.attempts < job.maxAttempts) {
          // Put back in queue for retry
          job.status = "pending"
          this.queue.push(job)
        } else {
          job.status = "failed"
          job.error = error instanceof Error ? error.message : String(error)
        }
      }
    } finally {
      this.processing = false

      // Continue processing queue
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 0)
      }
    }
  }

  getQueueStats(): {
    pending: number
    processing: number
    completed: number
    failed: number
    total: number
  } {
    const pending = this.queue.filter((job) => job.status === "pending").length
    const processing = this.queue.filter((job) => job.status === "processing").length
    const completed = this.queue.filter((job) => job.status === "completed").length
    const failed = this.queue.filter((job) => job.status === "failed").length

    return {
      pending,
      processing,
      completed,
      failed,
      total: this.queue.length,
    }
  }
}

export const jobQueue = JobQueue.getInstance()
