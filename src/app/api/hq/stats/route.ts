import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [entityCount, connectionCount, lastMention, messageResult] = await Promise.all([
    prisma.entity.count({ where: { userId } }),
    prisma.relationship.count({ where: { userId } }),
    prisma.mention.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT "sourceId")::bigint AS count
      FROM "Mention"
      WHERE "userId" = ${userId}
    `,
  ])

  return NextResponse.json({
    entities: entityCount,
    connections: connectionCount,
    messages: Number(messageResult[0]?.count ?? 0),
    lastActive: lastMention?.createdAt ?? null,
  })
}
