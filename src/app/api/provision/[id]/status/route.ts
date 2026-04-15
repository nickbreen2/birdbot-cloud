import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

type ProvisionStatus = "online" | "offline" | "provisioning" | "error"

function toProvisionStatus(agentStatus: string): ProvisionStatus {
  switch (agentStatus) {
    case "active":       return "online"
    case "provisioning": return "provisioning"
    case "error":        return "error"
    default:             return "offline" // incubating, offline
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: agentId } = await params

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, clerkUserId: userId },
      include: { server: true },
    })
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 })

    return NextResponse.json({
      status: toProvisionStatus(agent.status),
      agentId,
      containerId: agent.containerId ?? null,
      serverIp: agent.server?.ip ?? null,
    })
  } catch (err) {
    console.error("[GET /api/provision/[id]/status] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
