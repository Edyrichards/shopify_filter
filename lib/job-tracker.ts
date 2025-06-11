// Job tracking and status management
export interface JobStatus {
  id: string
  type: "full_sync" | "bulk_sync" | "incremental_sync"
  shopDomain: string
  status: "pending" | "running" | "completed" | "failed"
  progress?: {
    current: number
    total: number
    percentage: number
  }
  startTime: Date
  endTime?: Date
  duration?: number
  result?: any
  error?: string
  metadata?: Record<string, any>
}

class JobTracker {
  private static instance: JobTracker
  private jobs = new Map<string, JobStatus>()

  static getInstance(): JobTracker {
    if (!JobTracker.instance) {
      JobTracker.instance = new JobTracker()
    }
    return JobTracker.instance
  }

  createJob(id: string, type: JobStatus["type"], shopDomain: string, metadata?: Record<string, any>): JobStatus {
    const job: JobStatus = {
      id,
      type,
      shopDomain,
      status: "pending",
      startTime: new Date(),
      metadata,
    }

    this.jobs.set(id, job)
    console.log(`📝 Job created: ${id} (${type}) for ${shopDomain}`)
    return job
  }

  startJob(jobId: string): JobStatus | null {
    const job = this.jobs.get(jobId)
    if (!job) return null

    job.status = "running"
    job.startTime = new Date()
    this.jobs.set(jobId, job)

    console.log(`🚀 Job started: ${jobId}`)
    return job
  }

  updateProgress(jobId: string, current: number, total: number): JobStatus | null {
    const job = this.jobs.get(jobId)
    if (!job) return null

    job.progress = {
      current,
      total,
      percentage: Math.round((current / total) * 100),
    }
    this.jobs.set(jobId, job)

    return job
  }

  completeJob(jobId: string, result?: any): JobStatus | null {
    const job = this.jobs.get(jobId)
    if (!job) return null

    job.status = "completed"
    job.endTime = new Date()
    job.duration = job.endTime.getTime() - job.startTime.getTime()
    job.result = result
    this.jobs.set(jobId, job)

    console.log(`✅ Job completed: ${jobId} (${job.duration}ms)`)
    return job
  }

  failJob(jobId: string, error: string): JobStatus | null {
    const job = this.jobs.get(jobId)
    if (!job) return null

    job.status = "failed"
    job.endTime = new Date()
    job.duration = job.endTime.getTime() - job.startTime.getTime()
    job.error = error
    this.jobs.set(jobId, job)

    console.log(`❌ Job failed: ${jobId} - ${error}`)
    return job
  }

  getJob(jobId: string): JobStatus | null {
    return this.jobs.get(jobId) || null
  }

  getJobsByShop(shopDomain: string): JobStatus[] {
    return Array.from(this.jobs.values()).filter((job) => job.shopDomain === shopDomain)
  }

  getAllJobs(): JobStatus[] {
    return Array.from(this.jobs.values())
  }

  // Cleanup old completed jobs (older than 24 hours)
  cleanup(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    let cleaned = 0

    for (const [id, job] of this.jobs.entries()) {
      if (job.status === "completed" && job.endTime && job.endTime < cutoff) {
        this.jobs.delete(id)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old jobs`)
    }
  }
}

export const jobTracker = JobTracker.getInstance()

// Start cleanup interval
if (typeof window === "undefined") {
  setInterval(
    () => {
      jobTracker.cleanup()
    },
    60 * 60 * 1000,
  ) // Every hour
}
