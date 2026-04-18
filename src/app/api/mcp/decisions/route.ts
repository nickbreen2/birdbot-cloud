import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

    await prisma.cloudDecision.create({
      data: {
        userToken: token,
        project: body.project ?? "default",
        sessionId: body.sessionId ?? null,
        decision: body.decision,
        reasoning: body.reasoning ?? null,
        createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/mcp/decisions] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
