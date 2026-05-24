import { prisma } from "@/lib/prisma"
import { sendTelegramMessage } from "@/lib/telegram"
import { sendWhatsAppMessage, sendWhatsAppTemplate } from "@/lib/whatsapp"

const SESSION_WINDOW_MS = 24 * 60 * 60 * 1000
const REDIRECT_COOLDOWN_MS = 24 * 60 * 60 * 1000

export async function sendMessage(userId: string, text: string): Promise<void> {
  const prefs = await prisma.userPreferences.findUnique({ where: { userId } })
  if (!prefs?.homeChannel) return

  if (prefs.homeChannel === "whatsapp") {
    const wa = await prisma.whatsAppUser.findUnique({ where: { userId } })
    if (!wa) return
    const withinWindow =
      wa.lastInboundAt != null &&
      Date.now() - wa.lastInboundAt.getTime() < SESSION_WINDOW_MS
    if (withinWindow) {
      await sendWhatsAppMessage(wa.phoneNumber, text)
    } else {
      await sendWhatsAppTemplate(wa.phoneNumber, "bird_checkin_v1")
    }
    return
  }

  // Default: telegram (or any other future channel falls through to telegram lookup)
  const tg = await prisma.telegramUser.findUnique({ where: { userId } })
  if (!tg) return
  // telegramChatId is stored as a string in the DB; sendTelegramMessage accepts number.
  // Use Number() to explicitly convert the numeric string to a number.
  await sendTelegramMessage(Number(tg.telegramChatId), text)
}

export async function sendRedirectMessage(
  userId: string,
  inboundChannel: "telegram" | "whatsapp"
): Promise<void> {
  const prefs = await prisma.userPreferences.findUnique({ where: { userId } })
  if (!prefs?.homeChannel) return

  const homeName = prefs.homeChannel === "telegram" ? "Telegram" : "WhatsApp"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://birdbot.ai"
  const text = `Hey, Bird is currently living in ${homeName}. Switch home to chat here: ${appUrl}/settings`

  if (inboundChannel === "whatsapp") {
    const wa = await prisma.whatsAppUser.findUnique({ where: { userId } })
    if (!wa) return
    const tooSoon =
      wa.lastRedirectAt != null &&
      Date.now() - wa.lastRedirectAt.getTime() < REDIRECT_COOLDOWN_MS
    if (tooSoon) return
    await sendWhatsAppMessage(wa.phoneNumber, text)
    // Update after send — intentional: if send fails, we retry on next inbound rather than silently dropping
    await prisma.whatsAppUser.update({
      where: { userId },
      data: { lastRedirectAt: new Date() },
    })
    return
  }

  const tg = await prisma.telegramUser.findUnique({ where: { userId } })
  if (!tg) return
  const tooSoon =
    tg.lastRedirectAt != null &&
    Date.now() - tg.lastRedirectAt.getTime() < REDIRECT_COOLDOWN_MS
  if (tooSoon) return
  await sendTelegramMessage(Number(tg.telegramChatId), text)
  // Update after send — intentional: if send fails, we retry on next inbound rather than silently dropping
  await prisma.telegramUser.update({
    where: { userId },
    data: { lastRedirectAt: new Date() },
  })
}
