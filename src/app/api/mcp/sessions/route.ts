import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { tasks } from "@trigger.dev/sdk"
import type { regenerateProjectBrief } from "@/trigger/brief"
import type { extractEntities } from "@/trigger/extractEntities"

export async function POST(request: Request) {
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

    const body = await request.json() as {
      project?: string
      sessionId?: string
      summary?: string
      createdAt?: string
    }

    if (!body.sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 })
    }

    const project = body.project ?? "default"

    await prisma.cloudSession.upsert({
      where: { sessionId: body.sessionId },
      create: {
        userToken: token,
        project,
        sessionId: body.sessionId,
        summary: body.summary ?? null,
        createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      },
      update: {
        summary: body.summary ?? null,
        syncedAt: new Date(),
      },
    })

    // Fire-and-forget background tasks
    tasks.trigger<typeof regenerateProjectBrief>("regenerate-project-brief", {
      userToken: token,
      project,
    }).catch(() => {})

    if (body.summary) {
      tasks.trigger<typeof extractEntities>("extract-entities", {
        text: body.summary,
        sourceType: "session",
        userId: connection.clerkUserId,
        userToken: token,
        project,
        sourceId: body.sessionId,
        snippet: body.summary.slice(0, 300),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/mcp/sessions] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
