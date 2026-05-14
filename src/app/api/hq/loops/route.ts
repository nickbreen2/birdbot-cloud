import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const dismissed = (user.privateMetadata?.dismissedLoops as string[] | undefined) ?? []

  if (dismissed.length === 0) return NextResponse.json({ loops: [] })

  const loops = await prisma.entity.findMany({
    where: { id: { in: dismissed }, userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, description: true, createdAt: true },
  })

  return NextResponse.json({ loops })
}
