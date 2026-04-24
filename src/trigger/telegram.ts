import { task } from "@trigger.dev/sdk"
import { prisma } from "@/lib/prisma"
import { sendTelegramMessage } from "@/lib/telegram"
import { runEntityExtraction } from "@/trigger/extractEntities"

const PAIR_PREFIX = "/start "

// Rate-limit "not paired" replies: one per telegramId per 10 minutes
const unpairedCooldown = new Map<number, number>()
const UNPAIRED_COOLDOWN_MS = 10 * 60 * 1000

type TelegramProcessPayload = {
  telegramId: number
  chatId: number
  messageId: number
  text: string
  firstName?: string
  username?: string
}

async function handlePairing(
  payload: TelegramProcessPayload,
  token: string
): Promise<void> {
  const { chatId, telegramId, firstName, username } = payload

  // Bug 3: already-paired user tapping /start again → warm welcome
  const existing = await prisma.telegramUser.findUnique({
    where: { telegramChatId: chatId.toString() },
    select: { firstName: true, username: true },
  })
  if (existing) {
    const name = existing.firstName ?? existing.username ?? "there"
    await sendTelegramMessage(chatId, `You're already connected, ${name}! Send me your notes and I'll log them to your knowledge graph.`)
    return
  }

  const pairingToken = await prisma.telegramPairingToken.findUnique({
    where: { token },
  })

  if (!pairingToken) {
    await sendTelegramMessage(chatId, "That pairing code isn't valid. Generate a new one from your BirdBot dashboard.")
    return
  }

  if (pairingToken.usedAt || pairingToken.expiresAt < new Date()) {
    await sendTelegramMessage(chatId, "That code has expired or already been used. Generate a new one from your BirdBot dashboard.")
    return
  }

  try {
    await prisma.telegramUser.create({
      data: {
        userId: pairingToken.userId,
        telegramChatId: chatId.toString(),
        username: username ?? null,
        firstName: firstName ?? null,
      },
    })
  } catch {
    await sendTelegramMessage(chatId, "This Telegram account is already connected to a BirdBot account.")
    return
  }

  await prisma.telegramPairingToken.update({
    where: { token },
    data: { usedAt: new Date() },
  })

  await sendTelegramMessage(chatId, "Connected! Send me your notes and I'll log them to your knowledge graph.")
}

async function handleMessage(
  payload: TelegramProcessPayload,
  userId: string
): Promise<void> {
  const { chatId, messageId, text } = payload

  const result = await runEntityExtraction({
    text,
    sourceType: "telegram",
    userId,
    sourceId: messageId.toString(),
    snippet: text,
  })

  if (result.error) {
    console.warn("[telegram] extraction error:", result.error, "for message", messageId)
    await sendTelegramMessage(chatId, "Got it — but I had trouble reading that one. Try rephrasing.")
    return
  }

  const total = result.entitiesCreated + result.entitiesReused
  if (total === 0) {
    await sendTelegramMessage(chatId, "Noted. Nothing specific to log from that one.")
    return
  }

  const parts: string[] = []
  if (result.entitiesCreated > 0) parts.push(`${result.entitiesCreated} new`)
  if (result.entitiesReused > 0) parts.push(`${result.entitiesReused} updated`)
  await sendTelegramMessage(chatId, `Noted. Logged ${parts.join(", ")} ${total === 1 ? "entity" : "entities"}.`)
}

export const telegramProcess = task({
  id: "telegram-process",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10_000,
  },
  run: async (payload: TelegramProcessPayload) => {
    const { chatId, telegramId, text } = payload

    // Bug 4: /start with no token
    if (text === "/start") {
      const existing = await prisma.telegramUser.findUnique({
        where: { telegramChatId: chatId.toString() },
        select: { firstName: true },
      })
      if (existing) {
        const name = existing.firstName ?? "there"
        await sendTelegramMessage(chatId, `You're already connected, ${name}! Send me your notes and I'll log them to your knowledge graph.`)
      } else {
        await sendTelegramMessage(chatId, "It looks like your pairing link didn't include a token — go back to your BirdBot dashboard and click the link again.")
      }
      return
    }

    if (text.startsWith(PAIR_PREFIX)) {
      const token = text.slice(PAIR_PREFIX.length).trim()
      await handlePairing(payload, token)
      return
    }

    const tgUser = await prisma.telegramUser.findUnique({
      where: { telegramChatId: chatId.toString() },
      select: { userId: true },
    })

    if (!tgUser) {
      // Bug 2: rate-limit to one "not recognized" reply per telegramId per 10 min
      const lastSent = unpairedCooldown.get(telegramId) ?? 0
      if (Date.now() - lastSent > UNPAIRED_COOLDOWN_MS) {
        unpairedCooldown.set(telegramId, Date.now())
        console.warn("[telegram] unpaired message from telegramId:", telegramId)
        await sendTelegramMessage(
          chatId,
          "I don't recognize this account yet. Visit your BirdBot dashboard → Integrations to get a pairing link."
        )
      }
      return
    }

    await handleMessage(payload, tgUser.userId)
  },
})
