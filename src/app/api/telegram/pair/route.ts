import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const botUsername = process.env.TELEGRAM_BOT_USERNAME
  if (!botUsername) {
    return NextResponse.json({ error: "Bot not configured" }, { status: 500 })
  }

  const token = crypto.randomBytes(6).toString("hex")
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.telegramPairingToken.create({
    data: { userId, token, expiresAt },
  })

  const deepLink = `https://t.me/${botUsername}?start=${token}`
  return NextResponse.json({ deepLink, token, expiresAt })
}
