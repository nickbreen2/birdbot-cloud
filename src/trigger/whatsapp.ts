import { task } from "@trigger.dev/sdk"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage } from "@/lib/whatsapp"
import { sendRedirectMessage } from "@/lib/messaging"
import { runEntityExtraction } from "@/trigger/extractEntities"
import { generateBirdReply } from "@/lib/replyPrompt"
import { getGraphContext } from "@/lib/graphContext"

type WhatsAppProcessPayload =
  | { phoneNumber: string; text: string; userId: string; pairingUserId?: never; pairingToken?: never }
  | { phoneNumber: string; text: string; pairingUserId: string; pairingToken: string; userId?: never }

const FIRST_MESSAGE =
  "Connected! Send me your notes and I'll remember everything for you."

// Rate-limit expired-subscription replies: one per userId per 24 hours
const expiredCooldown = new Map<string, number>()
const EXPIRED_COOLDOWN_MS = 24 * 60 * 60 * 1000

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

export const whatsappProcess = task({
  id: "whatsapp-process",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10_000,
  },
  run: async (payload: WhatsAppProcessPayload) => {
    const { phoneNumber, text, pairingUserId, pairingToken } = payload

    // Pairing flow
    if (pairingUserId && pairingToken) {
      const tokenRecord = await prisma.whatsAppPairingToken.findUnique({
        where: { token: pairingToken },
      })
      if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
        await sendWhatsAppMessage(
          "+" + phoneNumber,
          "That code has expired or already been used. Generate a new one from your BirdBot dashboard."
        )
        return
      }

      const existing = await prisma.whatsAppUser.findUnique({ where: { phoneNumber } })
      if (existing) {
        await sendWhatsAppMessage(
          "+" + phoneNumber,
          "This WhatsApp number is already connected to a BirdBot account."
        )
        return
      }

      await prisma.whatsAppUser.create({
        data: { userId: pairingUserId, phoneNumber },
      })
      await prisma.whatsAppPairingToken.update({
        where: { token: pairingToken },
        data: { usedAt: new Date() },
      })

      // Auto-set homeChannel if this is their first channel
      const prefs = await prisma.userPreferences.findUnique({ where: { userId: pairingUserId } })
      if (!prefs?.homeChannel) {
        await prisma.userPreferences.upsert({
          where: { userId: pairingUserId },
          create: { userId: pairingUserId, homeChannel: "whatsapp" },
          update: { homeChannel: "whatsapp" },
        })
      }

      await sendWhatsAppMessage("+" + phoneNumber, FIRST_MESSAGE)
      return
    }

    // Regular message from known user
    const userId = payload.userId!

    // Check subscription status before processing (admin bypass via ADMIN_CLERK_USER_IDS)
    const adminUserIds = (process.env.ADMIN_CLERK_USER_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean)
    const isActive = adminUserIds.includes(userId) || await checkSubscription(userId)

    if (!isActive) {
      const lastSent = expiredCooldown.get(userId) ?? 0
      if (Date.now() - lastSent > EXPIRED_COOLDOWN_MS) {
        expiredCooldown.set(userId, Date.now())
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://birdbot.ai"
        await sendWhatsAppMessage(
          "+" + phoneNumber,
          "Hey, it looks like your BirdBot subscription has ended. I'd love to keep helping you, but I need to be reactivated to do that. Once reactivated, we'll pick right up where we left off."
        )
        await sendWhatsAppMessage("+" + phoneNumber, `${appUrl}/sign-in`)
      }
      return
    }

    // Update lastInboundAt for 24h window tracking
    try {
      await prisma.whatsAppUser.update({
        where: { userId },
        data: { lastInboundAt: new Date() },
      })
    } catch (err) {
      console.error("[whatsapp-process] Failed to update lastInboundAt:", err)
      return
    }

    // Check if WhatsApp is the home channel
    const prefs = await prisma.userPreferences.findUnique({ where: { userId } })
    if (prefs?.homeChannel !== "whatsapp") {
      await sendRedirectMessage(userId, "whatsapp")
      return
    }

    const [result, context] = await Promise.all([
      runEntityExtraction({
        text,
        sourceType: "whatsapp",
        userId,
        sourceId: phoneNumber + "_" + Date.now(),
        snippet: text,
      }),
      getGraphContext(userId),
    ])

    if (result.error) {
      const reply = await generateBirdReply(
        { text, entities: [], counts: { entitiesCreated: 0, entitiesUpdated: 0, totalEntities: 0 }, error: true, ...context },
        "Got that, something glitched on my end. Try again?"
      )
      await sendWhatsAppMessage("+" + phoneNumber, reply)
      return
    }

    const total = result.entitiesCreated + result.entitiesReused
    const reply = await generateBirdReply(
      {
        text,
        entities: total > 0 ? result.entities : [],
        counts: { entitiesCreated: result.entitiesCreated, entitiesUpdated: result.entitiesReused, totalEntities: total },
        error: false,
        ...context,
      },
      "Got it."
    )
    await sendWhatsAppMessage("+" + phoneNumber, reply)
  },
})
