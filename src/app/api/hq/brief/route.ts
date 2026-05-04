import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

interface ThreadRow {
  id: string
  name: string
  type: string
  description: string | null
  mention_count: bigint
  last_mention_at: Date
}

interface LearnedRow {
  id: string
  snippet: string
  created_at: Date
  entity_name: string
  entity_type: string
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const dismissed = (user.privateMetadata?.dismissedLoops as string[] | undefined) ?? []

  const [threadRows, loopEntities, learnedRows] = await Promise.all([
    prisma.$queryRaw<ThreadRow[]>`
      SELECT e.id, e.name, e.type, e.description,
             COUNT(m.id)::bigint AS mention_count,
             MAX(m."createdAt") AS last_mention_at
      FROM "Entity" e
      JOIN "Mention" m ON m."entityId" = e.id
      WHERE e."userId" = ${userId}
        AND e.type != 'task'
      GROUP BY e.id
      ORDER BY mention_count DESC, last_mention_at DESC
      LIMIT 6
    `,
    prisma.entity.findMany({
      where: {
        userId,
        type: "task",
        ...(dismissed.length > 0 ? { id: { notIn: dismissed } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, description: true, createdAt: true },
    }),
    prisma.$queryRaw<LearnedRow[]>`
      SELECT sub.id, sub.snippet, sub.created_at, sub.entity_name, sub.entity_type
      FROM (
        SELECT DISTINCT ON (m."sourceId")
          m.id,
          m.snippet,
          m."createdAt" AS created_at,
          e.name AS entity_name,
          e.type AS entity_type
        FROM "Mention" m
        JOIN "Entity" e ON m."entityId" = e.id
        WHERE m."userId" = ${userId}
          AND m.snippet IS NOT NULL
        ORDER BY m."sourceId", m."createdAt" DESC
      ) sub
      ORDER BY sub.created_at DESC
      LIMIT 3
    `,
  ])

  return NextResponse.json({
    threads: threadRows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      description: r.description,
      mentionCount: Number(r.mention_count),
      lastMentionAt: r.last_mention_at,
    })),
    loops: loopEntities.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      createdAt: e.createdAt,
    })),
    learned: learnedRows.map((r) => ({
      id: r.id,
      snippet: r.snippet,
      createdAt: r.created_at,
      entityName: r.entity_name,
      entityType: r.entity_type,
    })),
  })
}
