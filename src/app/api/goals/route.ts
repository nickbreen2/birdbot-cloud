import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        cadence: true,
        lastCheckinAt: true,
        targetDate: true,
        createdAt: true,
        entityId: true,
        entity: {
          select: {
            mentions: {
              orderBy: { createdAt: "asc" },
              take: 1,
              select: { snippet: true },
            },
          },
        },
      },
    })

    const pending = goals
      .filter((g) => g.status === "pending_confirmation")
      .map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        createdAt: g.createdAt,
        entityId: g.entityId,
        triggerSnippet: g.entity.mentions[0]?.snippet ?? null,
      }))

    const active = goals
      .filter((g) => g.status === "active")
      .map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        cadence: g.cadence,
        lastCheckinAt: g.lastCheckinAt,
        targetDate: g.targetDate,
        createdAt: g.createdAt,
        entityId: g.entityId,
      }))

    return NextResponse.json({ pending, active })
  } catch (err) {
    console.error("[GET /api/goals] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
