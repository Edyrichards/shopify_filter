import { type NextRequest, NextResponse } from "next/server"
import { syncService } from "@/lib/sync-service"
import { validateShopAuth, generateJobId } from "@/lib/auth-helpers"
import { jobTracker } from "@/lib/job-tracker"
import { errorTracker, ErrorSeverity } from "@/lib/error-handler"
import { metrics } from "@/lib/metrics"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let jobId: string | null = null

  try {
    const { shopDomain, accessToken } = await request.json()

    // Validate authentication
    const authResult = await validateShopAuth(shopDomain, accessToken)
    if (!authResult.isValid) {
      errorTracker.trackError(new Error(`Auth validation failed: ${authResult.error}`), ErrorSeverity.MEDIUM, {
        shopDomain,
        endpoint: "sync/full",
      })
      return NextResponse.json({ error: authResult.error }, { status: 400 })
    }

    // Generate unique job ID
    jobId = generateJobId("full_sync")

    // Create job record
    const job = jobTracker.createJob(jobId, "full_sync", authResult.shopDomain!, {
      requestedAt: new Date().toISOString(),
      userAgent: request.headers.get("user-agent"),
    })

    // Log job start
    console.log(`🔄 Starting full sync job ${jobId} for ${authResult.shopDomain}`)
    metrics.increment("sync.full.started", { shopDomain: authResult.shopDomain! })

    // Start job
    jobTracker.startJob(jobId)

    // Start full sync in background
    syncService
      .fullSync(authResult.shopDomain!, authResult.accessToken!)
      .then((result) => {
        // Complete job on success
        jobTracker.completeJob(jobId!, result)
        metrics.increment("sync.full.completed", { shopDomain: authResult.shopDomain! })
        metrics.timing("sync.full.duration", startTime, { shopDomain: authResult.shopDomain! })
      })
      .catch((error) => {
        // Fail job on error
        jobTracker.failJob(jobId!, error.message)
        errorTracker.trackError(error, ErrorSeverity.HIGH, {
          jobId,
          shopDomain: authResult.shopDomain,
          context: "full_sync",
        })
        metrics.increment("sync.full.failed", { shopDomain: authResult.shopDomain! })
      })

    return NextResponse.json({
      success: true,
      message: "Full sync initiated successfully",
      jobId,
      shopDomain: authResult.shopDomain,
      timestamp: new Date().toISOString(),
      estimatedDuration: "5-15 minutes",
    })
  } catch (error) {
    if (jobId) {
      jobTracker.failJob(jobId, error instanceof Error ? error.message : "Unknown error")
    }

    errorTracker.trackError(
      error instanceof Error ? error : new Error("Full sync initiation error"),
      ErrorSeverity.HIGH,
      { jobId, endpoint: "sync/full" },
    )

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
