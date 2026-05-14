import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { tasks } from "@trigger.dev/sdk"
import type { regenerateProjectBrief } from "@/trigger/brief"
import type { extractEntities } from "@/trigger/extractEntities"

const sessionSchema = z.object({
  project: z.string().max(200).optional(),
  sessionId: z.string().min(1).max(200),
  summary: z.string().max(50_000).optional(),
  createdAt: z.string().datetime().optional(),
})

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

    const raw = await request.text()
    if (raw.length > 100_000) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 })
    }

    let body: z.infer<typeof sessionSchema>
    try {
      body = sessionSchema.parse(JSON.parse(raw))
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
