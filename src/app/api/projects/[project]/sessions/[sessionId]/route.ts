import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ project: string; sessionId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sessionId } = await params

    const connection = await prisma.mcpConnection.findUnique({
      where: { clerkUserId: userId },
    })

    if (!connection) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const session = await prisma.cloudSession.findUnique({
      where: { sessionId },
    })

    if (!session || session.userToken !== connection.userToken) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const decisions = await prisma.cloudDecision.findMany({
      where: { sessionId, userToken: connection.userToken },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({
      session: {
        sessionId: session.sessionId,
        project: session.project,
        summary: session.summary,
        createdAt: session.createdAt,
        decisions: decisions.map((d) => ({
          id: d.id,
          decision: d.decision,
          reasoning: d.reasoning,
          createdAt: d.createdAt,
        })),
      },
    })
  } catch (err) {
    console.error("[/api/projects/.../sessions/[sessionId]] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
