import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const entity = await prisma.entity.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!entity || entity.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const mentions = await prisma.mention.findMany({
      where: { entityId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, sourceType: true, sourceId: true, snippet: true, createdAt: true },
    })

    return NextResponse.json({ mentions })
  } catch (err) {
    console.error("[GET /api/memory/[id]/mentions] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
