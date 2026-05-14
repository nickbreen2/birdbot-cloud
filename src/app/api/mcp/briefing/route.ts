import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { synthesizeBriefing } from "@/lib/synthesis"
import { checkRateLimit } from "@/lib/rateLimit"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const connection = await prisma.mcpConnection.findUnique({
      where: { userToken: token },
    })

    if (!connection) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const allowed = await checkRateLimit(`briefing:${token}`, 10, 60 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const project = searchParams.get("project")

    if (!project) {
      return NextResponse.json({ error: "project is required" }, { status: 400 })
    }

    if (project.length > 200 || !/^[\w\-:.]+$/.test(project)) {
      return NextResponse.json({ error: "Invalid project name" }, { status: 400 })
    }

    const [cloudSessions, cloudDecisions] = await Promise.all([
      prisma.cloudSession.findMany({
        where: { userToken: token, project },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.cloudDecision.findMany({
        where: { userToken: token, project },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])

    const sessions = cloudSessions.map(s => ({
      summary: s.summary ?? "",
      created_at: s.createdAt.toISOString(),
    }))

    const decisions = cloudDecisions.map(d => ({
      decision: d.decision,
      reasoning: d.reasoning,
      created_at: d.createdAt.toISOString(),
    }))

    const briefing = await synthesizeBriefing(sessions, decisions, project)
    const sessionId = crypto.randomUUID()

    return NextResponse.json({ briefing, sessionId })
  } catch (err) {
    console.error("[/api/mcp/briefing] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
