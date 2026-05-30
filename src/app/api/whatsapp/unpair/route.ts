import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await prisma.whatsAppUser.deleteMany({ where: { userId } })

    // If WhatsApp was home, auto-switch to Telegram (if connected) or null
    const prefs = await prisma.userPreferences.findUnique({ where: { userId } })
    if (prefs?.homeChannel === "whatsapp") {
      const tgUser = await prisma.telegramUser.findUnique({ where: { userId } })
      await prisma.userPreferences.update({
        where: { userId },
        data: { homeChannel: tgUser ? "telegram" : null },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/whatsapp/unpair] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
