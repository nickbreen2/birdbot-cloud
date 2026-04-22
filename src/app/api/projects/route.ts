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

    const [cloudProjects, sessionGroups, decisionGroups] = await Promise.all([
      prisma.cloudProject.findMany({
        where: { userToken },
        orderBy: { createdAt: "desc" },
      }),
      prisma.cloudSession.groupBy({
        by: ["project"],
        where: { userToken },
        _count: { id: true },
        _max: { createdAt: true },
      }),
      prisma.cloudDecision.groupBy({
        by: ["project"],
        where: { userToken },
        _count: { id: true },
      }),
    ])

    const sessionMap = Object.fromEntries(
      sessionGroups.map((g) => [g.project, { count: g._count.id, lastAt: g._max.createdAt }])
    )
    const decisionMap = Object.fromEntries(
      decisionGroups.map((g) => [g.project, g._count.id])
    )

    // Merge: start from CloudProject entries, add any session-only projects for backward compat
    const projectNames = new Set(cloudProjects.map((p) => p.name))
    const extraSessionProjects = sessionGroups
      .filter((g) => !projectNames.has(g.project))
      .map((g) => ({ name: g.project, createdAt: g._max.createdAt ?? new Date() }))

    const allProjects = [
      ...cloudProjects.map((p) => ({ name: p.name, createdAt: p.createdAt })),
      ...extraSessionProjects,
    ]

    const projects = allProjects.map((p) => ({
      name: p.name,
      createdAt: p.createdAt,
      sessionCount: sessionMap[p.name]?.count ?? 0,
      decisionCount: decisionMap[p.name] ?? 0,
      lastSessionAt: sessionMap[p.name]?.lastAt ?? null,
    }))

    return NextResponse.json({ projects })
  } catch (err) {
    console.error("[/api/projects] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as { name?: string }
    const name = body.name?.trim()

    if (!name || name.length > 200 || !/^[\w\-:.]+$/.test(name)) {
      return NextResponse.json({ error: "Invalid project name" }, { status: 400 })
    }

    const connection = await prisma.mcpConnection.findUnique({
      where: { clerkUserId: userId },
    })

    if (!connection) {
      return NextResponse.json({ error: "No MCP connection found" }, { status: 404 })
    }

    await prisma.cloudProject.upsert({
      where: { userToken_name: { userToken: connection.userToken, name } },
      create: { userToken: connection.userToken, name },
      update: {},
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[POST /api/projects] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
