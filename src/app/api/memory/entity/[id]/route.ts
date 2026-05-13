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
  sourceId: string
  snippet: string | null
  sourceType: string
  createdAt: Date
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const entity = await prisma.entity.findFirst({
      where: { id, userId },
      select: { id: true, name: true, type: true, description: true, createdAt: true },
    })

    if (!entity) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const rawLimit = parseInt(request.nextUrl.searchParams.get("limit") ?? "10", 10)
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 10 : rawLimit), 50)
    const cursorParam = request.nextUrl.searchParams.get("cursor") ?? null
    const decoded = cursorParam ? decodeCursor(cursorParam) : null

    const cursorWhere = decoded
      ? Prisma.sql`AND (
          dm."createdAt" < ${new Date(decoded.createdAt)}::timestamptz
          OR (dm."createdAt" = ${new Date(decoded.createdAt)}::timestamptz AND dm."sourceId" < ${decoded.sourceId})
        )`
      : Prisma.sql``

    const rawPage = await prisma.$queryRaw<RawMentionRow[]>`
      WITH distinct_mentions AS (
        SELECT DISTINCT ON (m."sourceId")
          m."sourceId", m.snippet, m."sourceType", m."createdAt"
        FROM "Mention" m
        WHERE m."entityId" = ${id}
          AND m."userId" = ${userId}
        ORDER BY m."sourceId", m."createdAt" DESC, m.id DESC
      )
      SELECT dm."sourceId", dm.snippet, dm."sourceType", dm."createdAt"
      FROM distinct_mentions dm
      WHERE TRUE
      ${cursorWhere}
      ORDER BY dm."createdAt" DESC, dm."sourceId" DESC
      LIMIT ${limit + 1}
    `

    const hasMore = rawPage.length > limit
    const page = hasMore ? rawPage.slice(0, limit) : rawPage
    const lastRow = page[page.length - 1]
    const nextCursor = hasMore && lastRow ? encodeCursor(lastRow.createdAt, lastRow.sourceId) : null

    return NextResponse.json({
      entity: {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        description: entity.description,
        createdAt: entity.createdAt.toISOString(),
      },
      mentions: page.map((m) => ({
        sourceId: m.sourceId,
        sourceType: m.sourceType,
        snippet: m.snippet,
        createdAt: m.createdAt,
      })),
      nextCursor,
      hasMore,
    })
  } catch (err) {
    console.error("[GET /api/memory/entity/[id]] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
