import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ project: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { project } = await params

    const connection = await prisma.mcpConnection.findUnique({
      where: { clerkUserId: userId },
    })

    if (!connection) {
      return NextResponse.json({ sessions: [] })
    }

    const { userToken } = connection

    const [sessions, decisionGroups] = await Promise.all([
      prisma.cloudSession.findMany({
        where: { userToken, project },
        orderBy: { createdAt: "desc" },
      }),
      prisma.cloudDecision.groupBy({
        by: ["sessionId"],
        where: { userToken, project, sessionId: { not: null } },
        _count: { id: true },
      }),
    ])

    const countMap = Object.fromEntries(
      decisionGroups
        .filter((d) => d.sessionId != null)
        .map((d) => [d.sessionId!, d._count.id])
    )

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        summary: s.summary,
        decisionCount: countMap[s.sessionId] ?? 0,
        createdAt: s.createdAt,
      })),
    })
  } catch (err) {
    console.error("[/api/projects/[project]/sessions] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
