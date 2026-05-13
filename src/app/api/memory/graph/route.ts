import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [entityRows, edgeRows] = await Promise.all([
      prisma.entity.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          type: true,
          description: true,
          _count: { select: { mentions: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.relationship.findMany({
        where: { userId },
        select: { id: true, fromId: true, toId: true, label: true },
      }),
    ])

    const nodes = entityRows.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      description: e.description,
      mentionCount: e._count.mentions,
    }))

    const edges = edgeRows.map((r) => ({
      id: r.id,
      fromId: r.fromId,
      toId: r.toId,
      label: r.label,
    }))

    return NextResponse.json({ nodes, edges })
  } catch (err) {
    console.error("[GET /api/memory/graph] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
