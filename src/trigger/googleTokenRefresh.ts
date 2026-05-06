import { schedules } from "@trigger.dev/sdk"
import { prisma } from "@/lib/prisma"
import { buildOAuthClient, handleTokenRevoked } from "@/lib/google"

export const googleTokenRefreshCron = schedules.task({
  id: "google-token-refresh",
  cron: "*/45 * * * *",
  run: async () => {
    const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000)

    const expiring = await prisma.googleConnection.findMany({
      where: { expiresAt: { lt: tenMinutesFromNow } },
      select: { userId: true, refreshToken: true },
    })

    for (const conn of expiring) {
      const client = buildOAuthClient()
      client.setCredentials({ refresh_token: conn.refreshToken })
      try {
        const { credentials } = await client.refreshAccessToken()
        await prisma.googleConnection.update({
          where: { userId: conn.userId },
          data: {
            accessToken: credentials.access_token!,
            expiresAt: new Date(credentials.expiry_date!),
          },
        })
      } catch {
        await handleTokenRevoked(conn.userId)
      }
    }
  },
})
