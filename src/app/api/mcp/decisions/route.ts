import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { tasks } from "@trigger.dev/sdk"
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
      decision?: string
      reasoning?: string
      createdAt?: string
    }

    if (!body.decision) {
      return NextResponse.json({ error: "decision required" }, { status: 400 })
    }

    const record = await prisma.cloudDecision.create({
      data: {
        userToken: token,
        project: body.project ?? "default",
        sessionId: body.sessionId ?? null,
        decision: body.decision,
        reasoning: body.reasoning ?? null,
        createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      },
    })

    const extractText = body.reasoning
      ? `${body.decision} — ${body.reasoning}`
      : body.decision

    tasks.trigger<typeof extractEntities>("extract-entities", {
      text: extractText,
      sourceType: "decision",
      userId: connection.clerkUserId,
      userToken: token,
      project: body.project ?? "default",
      sourceId: record.id,
      snippet: extractText.slice(0, 300),
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/mcp/decisions] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
