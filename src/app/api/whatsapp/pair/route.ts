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

  if (!process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return NextResponse.json({ error: "WhatsApp not configured" }, { status: 500 })
  }

  try {
    const windowStart = new Date(Date.now() - WINDOW_MS)
    const recentCount = await prisma.whatsAppPairingToken.count({
      where: { userId, createdAt: { gt: windowStart } },
    })
    if (recentCount >= RATE_LIMIT) {
      return NextResponse.json(
        { error: "Too many pairing requests. Try again in 15 minutes." },
        { status: 429 }
      )
    }

    const token = crypto.randomBytes(3).toString("hex").toUpperCase()
    const expiresAt = new Date(Date.now() + WINDOW_MS)

    await prisma.whatsAppPairingToken.create({
      data: { userId, token, expiresAt },
    })

    return NextResponse.json({ token, expiresAt })
  } catch (err) {
    console.error("[/api/whatsapp/pair] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
