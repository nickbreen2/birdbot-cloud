import { schedules } from "@trigger.dev/sdk"
import { prisma } from "@/lib/prisma"
import { sendTelegramMessage } from "@/lib/telegram"
import { getGraphContext } from "@/lib/graphContext"
import { generateDailyBrief } from "@/lib/outboundPrompt"
import { getUpcomingEvents } from "@/lib/googleCalendar"
import { getUnreadSummary } from "@/lib/googleGmail"

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

export const dailyBriefTask = schedules.task({
  id: "daily-brief",
  cron: "0 7 * * *",
  run: async () => {
    const telegramUsers = await prisma.telegramUser.findMany({
      select: { userId: true, telegramChatId: true },
    })

    for (const tgUser of telegramUsers) {
      const isActive = await checkSubscription(tgUser.userId)
      if (!isActive) continue

      try {
        const [graphContext, googleConn] = await Promise.all([
          getGraphContext(tgUser.userId),
          prisma.googleConnection.findUnique({
            where: { userId: tgUser.userId },
            select: { id: true },
          }),
        ])

        let calendarEvents: { title: string; start: string }[] | undefined
        let unreadEmails: { subject: string; from: string }[] | undefined

        if (googleConn) {
          const [events, emails] = await Promise.all([
            getUpcomingEvents(tgUser.userId, 1),
            getUnreadSummary(tgUser.userId, 3),
          ])
          calendarEvents = events
          unreadEmails = emails
        }

        const message = await generateDailyBrief(
          {
            ...graphContext,
            mode: "daily_brief",
            calendarEvents,
            unreadEmails,
          },
          "Morning. Anything on the agenda today?"
        )

        await sendTelegramMessage(parseInt(tgUser.telegramChatId, 10), message)
      } catch (err) {
        console.error(`[dailyBrief] failed for user ${tgUser.userId}:`, err)
      }
    }
  },
})
