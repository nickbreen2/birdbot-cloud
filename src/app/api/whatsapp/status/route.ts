import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const waUser = await prisma.whatsAppUser.findUnique({ where: { userId } })
    if (waUser) {
      return NextResponse.json({ connected: true, tokenExpired: false })
    }

    const latestToken = await prisma.whatsAppPairingToken.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    const tokenExpired = latestToken != null && latestToken.expiresAt < new Date()
    return NextResponse.json({ connected: false, tokenExpired })
  } catch (err) {
    console.error("[/api/whatsapp/status] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
