import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await prisma.telegramUser.deleteMany({ where: { userId } })

    // If Telegram was home, auto-switch to WhatsApp (if connected) or null
    const prefs = await prisma.userPreferences.findUnique({ where: { userId } })
    if (prefs?.homeChannel === "telegram") {
      const waUser = await prisma.whatsAppUser.findUnique({ where: { userId } })
      await prisma.userPreferences.update({
        where: { userId },
        data: { homeChannel: waUser ? "whatsapp" : null },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/telegram/unpair] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
