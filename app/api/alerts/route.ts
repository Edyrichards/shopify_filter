import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const alertData = await request.json()

    // In production, send to monitoring service or notification system
    console.error("CRITICAL ALERT:", alertData)

    // Example: Send to Slack webhook
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🚨 *ALERT* 🚨\n*Severity:* ${alertData.severity}\n*Message:* ${alertData.message}\n*Context:* ${JSON.stringify(alertData.context)}`,
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending alert:", error)
    return NextResponse.json({ error: "Failed to send alert" }, { status: 500 })
  }
}
