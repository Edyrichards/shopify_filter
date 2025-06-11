// New endpoint to check job status by ID
import { type NextRequest, NextResponse } from "next/server"
import { jobTracker } from "@/lib/job-tracker"
import { errorTracker, ErrorSeverity } from "@/lib/error-handler"

export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const { jobId } = params

    if (!jobId) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 })
    }

    const job = jobTracker.getJob(jobId)

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Calculate additional metrics
    const response = {
      ...job,
      isActive: job.status === "pending" || job.status === "running",
      elapsedTime: job.endTime ? job.endTime.getTime() - job.startTime.getTime() : Date.now() - job.startTime.getTime(),
      estimatedTimeRemaining:
        job.progress && job.status === "running"
          ? Math.round(
              ((Date.now() - job.startTime.getTime()) / job.progress.percentage) * (100 - job.progress.percentage),
            )
          : null,
    }

    return NextResponse.json(response)
  } catch (error) {
    errorTracker.trackError(error instanceof Error ? error : new Error("Job status check error"), ErrorSeverity.LOW, {
      jobId: params.jobId,
    })

    return NextResponse.json({ error: "Failed to get job status" }, { status: 500 })
  }
}
