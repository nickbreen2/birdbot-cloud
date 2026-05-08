import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tgUser = await prisma.telegramUser.findUnique({
    where: { userId },
    select: { username: true, firstName: true },
  })

  if (!tgUser) {
    return NextResponse.json({ paired: false })
  }

  const displayName = tgUser.username
    ? `@${tgUser.username}`
    : (tgUser.firstName ?? "Telegram account")

  return NextResponse.json({ paired: true, displayName })
}
