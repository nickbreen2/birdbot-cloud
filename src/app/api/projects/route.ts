import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const connection = await prisma.mcpConnection.findUnique({
      where: { clerkUserId: userId },
    })

    if (!connection) {
      return NextResponse.json({ projects: [] })
    }

    const { userToken } = connection

    const [sessionGroups, decisionGroups] = await Promise.all([
      prisma.cloudSession.groupBy({
        by: ["project"],
        where: { userToken },
        _count: { id: true },
        _max: { createdAt: true },
        orderBy: { _max: { createdAt: "desc" } },
      }),
      prisma.cloudDecision.groupBy({
        by: ["project"],
        where: { userToken },
        _count: { id: true },
      }),
    ])

    const decisionMap = Object.fromEntries(
      decisionGroups.map((g) => [g.project, g._count.id])
    )

    const projects = sessionGroups.map((g) => ({
      name: g.project,
      sessionCount: g._count.id,
      decisionCount: decisionMap[g.project] ?? 0,
      lastSessionAt: g._max.createdAt,
    }))

    return NextResponse.json({ projects })
  } catch (err) {
    console.error("[/api/projects] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
