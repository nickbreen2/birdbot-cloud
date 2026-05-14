import { schedules } from "@trigger.dev/sdk"
import { prisma } from "@/lib/prisma"
import { getUpcomingEvents } from "@/lib/googleCalendar"
import { getUnreadSummary } from "@/lib/googleGmail"
import { sendTelegramMessage } from "@/lib/telegram"

export const morningBriefTask = schedules.task({
  id: "morning-brief",
  cron: "0 7 * * *",
  run: async () => {
    const telegramUsers = await prisma.telegramUser.findMany({
      select: { userId: true, telegramChatId: true },
    })

    for (const tgUser of telegramUsers) {
      const [googleConn, subscription] = await Promise.all([
        prisma.googleConnection.findUnique({
          where: { userId: tgUser.userId },
          select: { id: true },
        }),
        prisma.subscription.findUnique({
          where: { clerkUserId: tgUser.userId },
          select: { status: true },
        }),
      ])
      if (!googleConn) continue
      if (!subscription || subscription.status !== "active") continue

      try {
        const [events, emails] = await Promise.all([
          getUpcomingEvents(tgUser.userId, 1),
          getUnreadSummary(tgUser.userId, 3),
        ])

        const lines: string[] = ["🌅 Good morning! Here's your briefing:\n"]

        if (events.length > 0) {
          lines.push("📅 *Today's calendar:*")
          for (const e of events) {
            const time = e.start
              ? new Date(e.start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
              : ""
            lines.push(`• ${e.title}${time ? ` at ${time}` : ""}`)
          }
          lines.push("")
        }

        if (emails.length > 0) {
          lines.push(`📬 *${emails.length} unread email${emails.length > 1 ? "s" : ""}:*`)
          for (const e of emails) {
            lines.push(`• ${e.subject} — ${e.from.split("<")[0].trim()}`)
          }
        }

        if (events.length === 0 && emails.length === 0) {
          lines.push("All clear — no events today and no unread emails.")
        }

        await sendTelegramMessage(parseInt(tgUser.telegramChatId, 10), lines.join("\n"))
      } catch (err) {
        console.error(`[morningBrief] failed for user ${tgUser.userId}:`, err)
      }
    }
  },
})
