import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

interface CursorPayload {
  createdAt: string
  sourceId: string
}

function encodeCursor(createdAt: Date, sourceId: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), sourceId })).toString("base64")
}

function decodeCursor(cursor: string): CursorPayload | null {
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf8")) as CursorPayload
  } catch {
    return null
  }
}

interface RawMentionRow {
  id: string
  sourceId: string
  snippet: string | null
  sourceType: string
  createdAt: Date
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = (searchParams.get("query") ?? "").trim().slice(0, 500)
    const rawLimit = parseInt(searchParams.get("limit") ?? "20", 10)
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 20 : rawLimit), 100)
    const cursorParam = searchParams.get("cursor") ?? null
    const decoded = cursorParam ? decodeCursor(cursorParam) : null

    // Build conditional SQL fragments
    const searchWhere = query
      ? Prisma.sql`AND (
          m.snippet ILIKE ${`%${query}%`}
          OR EXISTS (
            SELECT 1 FROM "Mention" m2
            JOIN "Entity" e ON m2."entityId" = e.id
            WHERE m2."sourceId" = m."sourceId"
              AND m2."userId" = ${userId}
              AND (e.name ILIKE ${`%${query}%`} OR e.description ILIKE ${`%${query}%`})
          )
        )`
      : Prisma.sql``

    const cursorWhere = decoded
      ? Prisma.sql`AND (
          dm."createdAt" < ${new Date(decoded.createdAt)}::timestamptz
          OR (dm."createdAt" = ${new Date(decoded.createdAt)}::timestamptz AND dm."sourceId" < ${decoded.sourceId})
        )`
      : Prisma.sql``

    // Step 1: Get one representative Mention per sourceId, paginated by createdAt DESC.
    // DISTINCT ON picks the most recent row per sourceId; the outer query applies cursor + sort.
    const rawPage = await prisma.$queryRaw<RawMentionRow[]>`
      WITH distinct_mentions AS (
        SELECT DISTINCT ON (m."sourceId")
          m.id, m."sourceId", m.snippet, m."sourceType", m."createdAt"
        FROM "Mention" m
        WHERE m."userId" = ${userId}
        ${searchWhere}
        ORDER BY m."sourceId", m."createdAt" DESC, m.id DESC
      )
      SELECT dm.id, dm."sourceId", dm.snippet, dm."sourceType", dm."createdAt"
      FROM distinct_mentions dm
      WHERE TRUE
      ${cursorWhere}
      ORDER BY dm."createdAt" DESC, dm."sourceId" DESC
      LIMIT ${limit + 1}
    `

    const hasMore = rawPage.length > limit
    const page = hasMore ? rawPage.slice(0, limit) : rawPage
    const sourceIds = page.map((m) => m.sourceId)

    // Step 2: Batch-fetch all entities for this page's source messages (no N+1).
    const entityMentions =
      sourceIds.length > 0
        ? await prisma.mention.findMany({
            where: { userId, sourceId: { in: sourceIds } },
            select: {
              sourceId: true,
              entity: { select: { id: true, name: true, type: true } },
            },
          })
        : []

    // Group entities by sourceId, deduplicating by entity id within each group.
    const entityMap = new Map<string, Map<string, { id: string; name: string; type: string }>>()
    for (const m of entityMentions) {
      if (!entityMap.has(m.sourceId)) entityMap.set(m.sourceId, new Map())
      entityMap.get(m.sourceId)!.set(m.entity.id, m.entity)
    }

    const messages = page.map((m) => ({
      sourceId: m.sourceId,
      sourceType: m.sourceType,
      snippet: m.snippet,
      createdAt: m.createdAt,
      entities: Array.from(entityMap.get(m.sourceId)?.values() ?? []),
    }))

    const lastMsg = page[page.length - 1]
    const nextCursor =
      hasMore && lastMsg ? encodeCursor(lastMsg.createdAt, lastMsg.sourceId) : null

    return NextResponse.json({ messages, nextCursor, hasMore })
  } catch (err) {
    console.error("[GET /api/memory] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
