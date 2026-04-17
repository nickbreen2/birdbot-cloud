import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const connection = await prisma.mcpConnection.findUnique({
      where: { clerkUserId: userId },
    })

    if (!connection || !connection.lastSeenAt) {
      return NextResponse.json({ connected: false, lastSeenAt: null })
    }

    const age = Date.now() - connection.lastSeenAt.getTime()
    const connected = age <= THIRTY_DAYS_MS

    return NextResponse.json({
      connected,
      lastSeenAt: connection.lastSeenAt.toISOString(),
    })
  } catch (err) {
    console.error("[/api/connection/status] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
