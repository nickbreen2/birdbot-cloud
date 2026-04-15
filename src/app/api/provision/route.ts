import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { tasks } from "@trigger.dev/sdk"
import { prisma } from "@/lib/prisma"
import type { provisionAgent } from "@/trigger/provision"

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const agentId = body?.agentId as string | undefined
    if (!agentId) {
      return NextResponse.json({ error: "Missing agentId" }, { status: 400 })
    }

    // Verify the agent exists and belongs to this user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, clerkUserId: userId },
    })
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Only provision agents that are in a provisionable state
    if (agent.status !== "incubating" && agent.status !== "error") {
      return NextResponse.json(
        { error: `Agent is already ${agent.status}` },
        { status: 409 }
      )
    }

    // Fire the background job — returns immediately, job handles all long-running work
    const handle = await tasks.trigger<typeof provisionAgent>("provision-agent", {
      agentId,
      clerkUserId: userId,
    })

    return NextResponse.json({ ok: true, runId: handle.id }, { status: 202 })
  } catch (err) {
    console.error("[/api/provision] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
