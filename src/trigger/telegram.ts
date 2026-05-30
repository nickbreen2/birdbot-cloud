import { task } from "@trigger.dev/sdk"
import { prisma } from "@/lib/prisma"
import { sendTelegramMessage } from "@/lib/telegram"
import { sendRedirectMessage } from "@/lib/messaging"
import { runEntityExtraction } from "@/trigger/extractEntities"
import { generateBirdReply } from "@/lib/replyPrompt"
import { getGraphContext } from "@/lib/graphContext"
import { detectAndScheduleFollowUp } from "@/lib/followUpScheduler"
import Anthropic from "@anthropic-ai/sdk"
import { getUpcomingEvents, createEvent } from "@/lib/googleCalendar"
import { getUnreadSummary, sendEmail } from "@/lib/googleGmail"
import { searchFiles, createDoc } from "@/lib/googleDrive"

const PAIR_PREFIX = "/start "

const anthropic = new Anthropic()

const GOOGLE_KEYWORDS = /\b(calendar|schedule|meeting|event|email|gmail|inbox|unread|drive|document|doc|file)\b/i

type GoogleIntent =
  | { action: "calendar_read"; days?: number }
  | { action: "calendar_create"; title: string; start: string; end: string; description?: string }
  | { action: "email_read" }
  | { action: "email_send"; to: string; subject: string; body: string }
  | { action: "drive_search"; query: string }
  | { action: "drive_create"; title: string; content: string }

// Rate-limit "not paired" replies: one per telegramId per 10 minutes
const unpairedCooldown = new Map<number, number>()
const UNPAIRED_COOLDOWN_MS = 10 * 60 * 1000

// Rate-limit expired-subscription replies: one per userId per 24 hours
const expiredCooldown = new Map<string, number>()
const EXPIRED_COOLDOWN_MS = 24 * 60 * 60 * 1000

type TelegramProcessPayload = {
  telegramId: number
  chatId: number
  messageId: number
  text: string
  firstName?: string
  username?: string
}

function isConfirmation(text: string): boolean {
  return /^(yes|confirm|yep|ok|sure|do it)$/i.test(text.trim())
}

async function detectGoogleIntent(text: string): Promise<GoogleIntent | null> {
  if (!GOOGLE_KEYWORDS.test(text)) return null

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: `Classify if this message requests a Google Calendar, Gmail, or Drive action.
Return ONLY valid JSON matching one of these shapes, or {"action":null} if not a Google request:
{"action":"calendar_read","days":7}
{"action":"calendar_create","title":"...","start":"ISO8601","end":"ISO8601","description":"optional"}
{"action":"email_read"}
{"action":"email_send","to":"email@example.com","subject":"...","body":"..."}
{"action":"drive_search","query":"..."}
{"action":"drive_create","title":"...","content":"..."}
{"action":null}`,
    messages: [{ role: "user", content: text }],
  })

  const raw = response.content[0].type === "text" ? response.content[0].text : "{}"
  try {
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}")
    if (!parsed.action) return null
    return parsed as GoogleIntent
  } catch {
    return null
  }
}

function buildConfirmPrompt(intent: GoogleIntent): string {
  if (intent.action === "calendar_create") {
    const when = new Date(intent.start).toLocaleString("en-US", {
      weekday: "long", month: "long", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    })
    return `📅 Here's the event I'd create:\n${intent.title}\n${when}${intent.description ? `\n${intent.description}` : ""}`
  }
  if (intent.action === "email_send") {
    return `📧 Here's the email I'd send:\nTo: ${intent.to}\nSubject: ${intent.subject}\n\n${intent.body}`
  }
  if (intent.action === "drive_create") {
    const preview = intent.content ? `\n\n${intent.content.slice(0, 200)}${intent.content.length > 200 ? "…" : ""}` : ""
    return `📄 Here's the doc I'd create:\n"${intent.title}"${preview}`
  }
  return "Ready to proceed?"
}

async function checkAndExecutePendingAction(
  chatId: number,
  userId: string,
  text: string
): Promise<boolean> {
  if (!isConfirmation(text)) return false

  const pending = await prisma.pendingAction.findFirst({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  })

  if (!pending) return false

  await prisma.pendingAction.delete({ where: { id: pending.id } })
  const intent = pending.payload as unknown as GoogleIntent

  try {
    if (intent.action === "calendar_create") {
      await createEvent(userId, { title: intent.title, start: intent.start, end: intent.end, description: intent.description })
      await sendTelegramMessage(chatId, "Done, it's on your calendar. ✅")
    } else if (intent.action === "email_send") {
      await sendEmail(userId, { to: intent.to, subject: intent.subject, body: intent.body })
      await sendTelegramMessage(chatId, "Done, email sent. ✅")
    } else if (intent.action === "drive_create") {
      await createDoc(userId, intent.title, intent.content)
      await sendTelegramMessage(chatId, `Done, "${intent.title}" created in your Drive. ✅`)
    }
  } catch (err) {
    console.error("[telegram] pending action execution failed:", err)
    await sendTelegramMessage(chatId, "Sorry, something went wrong executing that action. Try again?")
  }

  return true
}

async function handleGoogleIntent(
  chatId: number,
  userId: string,
  intent: GoogleIntent
): Promise<boolean> {
  const isWrite =
    intent.action === "calendar_create" ||
    intent.action === "email_send" ||
    intent.action === "drive_create"

  if (isWrite) {
    await prisma.pendingAction.deleteMany({ where: { userId } })
    await prisma.pendingAction.create({
      data: {
        userId,
        type: intent.action,
        payload: JSON.parse(JSON.stringify(intent)),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    })
    const prompt = buildConfirmPrompt(intent)
    await sendTelegramMessage(chatId, `${prompt}\n\nConfirm? (yes / no)`)
    return true
  }

  if (intent.action === "calendar_read") {
    const events = await getUpcomingEvents(userId, intent.days ?? 7)
    if (events.length === 0) {
      await sendTelegramMessage(chatId, "No upcoming events found.")
      return true
    }
    const lines = events.map((e) => {
      const start = e.start
        ? new Date(e.start).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true })
        : ""
      return `• ${e.title}${start ? ` — ${start}` : ""}`
    })
    await sendTelegramMessage(chatId, `📅 Upcoming events:\n${lines.join("\n")}`)
    return true
  }

  if (intent.action === "email_read") {
    const emails = await getUnreadSummary(userId, 5)
    if (emails.length === 0) {
      await sendTelegramMessage(chatId, "No unread emails.")
      return true
    }
    const lines = emails.map((e) => `• ${e.subject} — ${e.from.split("<")[0].trim()}`)
    await sendTelegramMessage(chatId, `📬 Unread emails:\n${lines.join("\n")}`)
    return true
  }

  if (intent.action === "drive_search") {
    const files = await searchFiles(userId, intent.query)
    if (files.length === 0) {
      await sendTelegramMessage(chatId, `No files found matching "${intent.query}".`)
      return true
    }
    const lines = files.map((f) => `• ${f.name}${f.webViewLink ? ` — ${f.webViewLink}` : ""}`)
    await sendTelegramMessage(chatId, `📂 Files matching "${intent.query}":\n${lines.join("\n")}`)
    return true
  }

  return false
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

async function checkSubscription(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { clerkUserId: userId },
    select: { status: true, currentPeriodEnd: true },
  })
  return !!(
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing") &&
    subscription.currentPeriodEnd > new Date()
  )
}

async function handleMessage(
  payload: TelegramProcessPayload,
  userId: string
): Promise<void> {
  const { chatId, messageId, text } = payload

  // Check subscription status before processing (admin bypass via ADMIN_CLERK_USER_IDS)
  const adminUserIds = (process.env.ADMIN_CLERK_USER_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean)
  const isActive = adminUserIds.includes(userId) || await checkSubscription(userId)

  if (!isActive) {
    const lastSent = expiredCooldown.get(userId) ?? 0
    if (Date.now() - lastSent > EXPIRED_COOLDOWN_MS) {
      expiredCooldown.set(userId, Date.now())
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://birdbot.ai"
      await sendTelegramMessage(
        chatId,
        "Hey, it looks like your BirdBot subscription has ended. I'd love to keep helping you, but I need to be reactivated to do that. Once reactivated, we'll pick right up where we left off."
      )
      await sendTelegramMessage(chatId, `${appUrl}/sign-in`)
    }
    return
  }

  // Check if user is confirming a pending write action
  const pendingHandled = await checkAndExecutePendingAction(chatId, userId, text)
  if (pendingHandled) return

  // Check for Google intent if user has a Google connection
  const googleConn = await prisma.googleConnection.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (googleConn) {
    const intent = await detectGoogleIntent(text)
    if (intent) {
      const googleHandled = await handleGoogleIntent(chatId, userId, intent)
      if (googleHandled) return
    }
  }

  const [result, context] = await Promise.all([
    runEntityExtraction({
      text,
      sourceType: "telegram",
      userId,
      sourceId: messageId.toString(),
      snippet: text,
    }),
    getGraphContext(userId),
  ])

  if (result.error) {
    console.warn("[telegram] extraction error:", result.error, "for message", messageId)
    const reply = await generateBirdReply(
      { text, entities: [], counts: { entitiesCreated: 0, entitiesUpdated: 0, totalEntities: 0 }, error: true, ...context },
      "Got that — something glitched on my end. Try again?"
    )
    await sendTelegramMessage(chatId, reply)
    return
  }

  const total = result.entitiesCreated + result.entitiesReused

  if (total === 0) {
    const reply = await generateBirdReply(
      { text, entities: [], counts: { entitiesCreated: 0, entitiesUpdated: 0, totalEntities: 0 }, error: false, ...context },
      "Got that."
    )
    await sendTelegramMessage(chatId, reply)
    return
  }

  const [reply] = await Promise.all([
    generateBirdReply(
      {
        text,
        entities: result.entities,
        counts: { entitiesCreated: result.entitiesCreated, entitiesUpdated: result.entitiesReused, totalEntities: total },
        error: false,
        ...context,
      },
      "Got it."
    ),
    detectAndScheduleFollowUp(
      userId,
      chatId,
      text,
      result.entities.map((e) => ({ name: e.name, type: e.type }))
    ),
  ])
  await sendTelegramMessage(chatId, reply)
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

    // Check if Telegram is the home channel. If WhatsApp is home, send redirect.
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: tgUser.userId },
      select: { homeChannel: true },
    })
    if (prefs?.homeChannel === "whatsapp") {
      await sendRedirectMessage(tgUser.userId, "telegram")
      return
    }

    await handleMessage(payload, tgUser.userId)
  },
})
