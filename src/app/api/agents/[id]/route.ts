import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { deprovisionAgent } from "@/lib/deprovisionAgent"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    // Verify ownership and check provisioning state
    const agent = await prisma.agent.findFirst({
      where: { id, clerkUserId: userId },
    })
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 })

    // If provisioned, deprovision first — removes container, Caddy route, and decrements pool count
    if (agent.serverId || agent.containerId) {
      await deprovisionAgent(id, userId)
    }

    // Delete the agent record
    await prisma.agent.deleteMany({
      where: { id, clerkUserId: userId },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[DELETE /api/agents/[id]] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
