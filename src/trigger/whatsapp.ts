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

    // Update lastInboundAt for 24h window tracking
    await prisma.whatsAppUser.update({
      where: { userId },
      data: { lastInboundAt: new Date() },
    })

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
