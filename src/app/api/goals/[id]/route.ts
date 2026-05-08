import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { GoalStatus } from "@/generated/prisma/enums"

const VALID_STATUSES = new Set<string>(["active", "paused", "completed", "abandoned"])

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body as { status: string }

    if (!status || !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: active, paused, completed, abandoned" },
        { status: 400 }
      )
    }

    const existing = await prisma.goal.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updated = await prisma.goal.update({
      where: { id },
      data: { status: status as GoalStatus },
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
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error("[PATCH /api/goals/[id]] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
