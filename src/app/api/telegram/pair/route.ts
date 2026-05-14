import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

const RATE_LIMIT = 5
const WINDOW_MS = 15 * 60 * 1000

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const botUsername = process.env.TELEGRAM_BOT_USERNAME
  if (!botUsername) {
    return NextResponse.json({ error: "Bot not configured" }, { status: 500 })
  }

  const windowStart = new Date(Date.now() - WINDOW_MS)
  const recentCount = await prisma.telegramPairingToken.count({
    where: { userId, createdAt: { gt: windowStart } },
  })
  if (recentCount >= RATE_LIMIT) {
    return NextResponse.json(
      { error: "Too many pairing requests. Try again in 15 minutes." },
      { status: 429 }
    )
  }

  const token = crypto.randomBytes(6).toString("hex")
  const expiresAt = new Date(Date.now() + WINDOW_MS)

  await prisma.telegramPairingToken.create({
    data: { userId, token, expiresAt },
  })

  const deepLink = `https://t.me/${botUsername}?start=${token}`
  return NextResponse.json({ deepLink, token, expiresAt })
}
