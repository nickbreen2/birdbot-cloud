import { schedules } from "@trigger.dev/sdk"
import { prisma } from "@/lib/prisma"
import { buildOAuthClient, handleTokenRevoked } from "@/lib/google"
import { decrypt, encrypt } from "@/lib/tokenEncryption"

export const googleTokenRefreshCron = schedules.task({
  id: "google-token-refresh",
  cron: "*/45 * * * *",
  machine: { preset: "small-2x" },
  run: async () => {
    const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000)

    const expiring = await prisma.googleConnection.findMany({
      where: { expiresAt: { lt: tenMinutesFromNow } },
      select: { userId: true, refreshToken: true },
    })

    for (const conn of expiring) {
      const client = buildOAuthClient()
      client.setCredentials({ refresh_token: decrypt(conn.refreshToken) })
      try {
        const { credentials } = await client.refreshAccessToken()
        const updateData: {
          accessToken: string
          expiresAt: Date
          refreshToken?: string
        } = {
          accessToken: encrypt(credentials.access_token!),
          expiresAt: new Date(credentials.expiry_date!),
        }
        if (credentials.refresh_token) {
          updateData.refreshToken = encrypt(credentials.refresh_token)
        }
        await prisma.googleConnection.update({
          where: { userId: conn.userId },
          data: updateData,
        })
      } catch {
        await handleTokenRevoked(conn.userId)
      }
    }
  },
})
