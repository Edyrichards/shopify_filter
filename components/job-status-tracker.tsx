"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

interface JobStatus {
  id: string
  type: "full_sync" | "bulk_sync" | "incremental_sync"
  shopDomain: string
  status: "pending" | "running" | "completed" | "failed"
  progress?: {
    current: number
    total: number
    percentage: number
  }
  startTime: string
  endTime?: string
  duration?: number
  result?: any
  error?: string
  metadata?: Record<string, any>
  isActive: boolean
  elapsedTime: number
  estimatedTimeRemaining?: number
}

interface JobStatusTrackerProps {
  jobId: string
  onComplete?: (job: JobStatus) => void
  autoRefresh?: boolean
}

export default function JobStatusTracker({ jobId, onComplete, autoRefresh = true }: JobStatusTrackerProps) {
  const [job, setJob] = useState<JobStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/sync/status/${jobId}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError("Job not found")
        } else {
          setError("Failed to fetch job status")
        }
        return
      }

      const jobData = await response.json()
      setJob(jobData)
      setError(null)

      // Call onComplete callback if job is finished
      if (onComplete && (jobData.status === "completed" || jobData.status === "failed")) {
        onComplete(jobData)
      }
    } catch (err) {
      setError("Network error")
      console.error("Error fetching job status:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobStatus()

    if (!autoRefresh) return

    // Set up polling for active jobs
    const interval = setInterval(() => {
      if (job?.isActive) {
        fetchJobStatus()
      }
    }, 2000) // Poll every 2 seconds for active jobs

    return () => clearInterval(interval)
  }, [jobId, autoRefresh, job?.isActive])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "running":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const formatJobType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  if (isLoading && !job) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading job status...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
          <span className="text-red-600">{error}</span>
          <Button variant="outline" size="sm" onClick={fetchJobStatus} className="ml-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!job) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <span className="text-gray-500">No job data available</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(job.status)}
            <span>{formatJobType(job.type)}</span>
          </div>
          <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Job ID:</span>
            <p className="font-mono text-xs">{job.id}</p>
          </div>
          <div>
            <span className="text-gray-500">Shop:</span>
            <p>{job.shopDomain}</p>
          </div>
          <div>
            <span className="text-gray-500">Started:</span>
            <p>{new Date(job.startTime).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-500">Elapsed:</span>
            <p>{formatDuration(job.elapsedTime)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {job.progress && job.status === "running" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>
                {job.progress.current} / {job.progress.total} ({job.progress.percentage}%)
              </span>
            </div>
            <Progress value={job.progress.percentage} className="h-2" />
            {job.estimatedTimeRemaining && (
              <p className="text-xs text-gray-500">
                Estimated time remaining: {formatDuration(job.estimatedTimeRemaining)}
              </p>
            )}
          </div>
        )}

        {/* Completion Details */}
        {job.status === "completed" && job.result && (
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Completed Successfully</h4>
            <div className="text-sm text-green-700">
              {job.result.processedProducts && <p>Processed: {job.result.processedProducts} products</p>}
              {job.result.totalBatches && <p>Batches: {job.result.totalBatches}</p>}
              {job.duration && <p>Duration: {formatDuration(job.duration)}</p>}
            </div>
          </div>
        )}

        {/* Error Details */}
        {job.status === "failed" && job.error && (
          <div className="bg-red-50 p-3 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Failed</h4>
            <p className="text-sm text-red-700">{job.error}</p>
          </div>
        )}

        {/* Metadata */}
        {job.metadata && (
          <div className="text-xs text-gray-500">
            {job.metadata.productCount && <p>Products: {job.metadata.productCount}</p>}
            {job.metadata.requestedAt && <p>Requested: {new Date(job.metadata.requestedAt).toLocaleString()}</p>}
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={fetchJobStatus} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
