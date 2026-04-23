import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")?.trim() ?? ""
    const rawLimit = parseInt(searchParams.get("limit") ?? "20", 10)
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 20 : rawLimit), 100)
    const cursor = searchParams.get("cursor") ?? undefined

    const entities = await prisma.entity.findMany({
      where: {
        userId,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        type: true,
        name: true,
        description: true,
        project: true,
        createdAt: true,
        mentions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, sourceType: true, snippet: true },
        },
      },
    })

    const hasMore = entities.length > limit
    const page = hasMore ? entities.slice(0, limit) : entities

    const result = page.map(({ mentions, ...entity }) => ({
      ...entity,
      previewMention: mentions[0] ?? null,
    }))

    return NextResponse.json({
      entities: result,
      nextCursor: hasMore ? page[page.length - 1].id : null,
      hasMore,
    })
  } catch (err) {
    console.error("[GET /api/memory] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
