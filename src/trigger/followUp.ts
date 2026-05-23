import { task, wait } from "@trigger.dev/sdk"
import { prisma } from "@/lib/prisma"
import { sendTelegramMessage } from "@/lib/telegram"
import { getGraphContext } from "@/lib/graphContext"
import { generateDailyBrief } from "@/lib/outboundPrompt"

export type FollowUpPayload = {
  userId: string
  chatId: number
  entityName: string
  entityType: string
  followUpAt: string  // ISO 8601 string
}

async function checkSubscription(userId: string): Promise<boolean> {
  const adminUserIds = (process.env.ADMIN_CLERK_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (adminUserIds.includes(userId)) return true

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

export const followUpTask = task({
  id: "follow-up",
  run: async (payload: FollowUpPayload) => {
    await wait.until({ date: new Date(payload.followUpAt) })

    const isActive = await checkSubscription(payload.userId)
    if (!isActive) return

    const context = await getGraphContext(payload.userId)
    const message = await generateDailyBrief(
      {
        ...context,
        mode: "follow_up",
        followUpEntity: { name: payload.entityName, type: payload.entityType },
      },
      `Hey, how did the ${payload.entityName} go?`
    )

    await sendTelegramMessage(payload.chatId, message)
  },
})
