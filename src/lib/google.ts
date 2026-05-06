import { google } from "googleapis"
import type { OAuth2Client } from "google-auth-library"
import { createHmac, timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"
import { sendTelegramMessage } from "@/lib/telegram"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OAuth2Constructor = google.auth.OAuth2 as any

export function buildOAuthClient(): OAuth2Client {
  return new OAuth2Constructor(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`
  ) as OAuth2Client
}

export function createState(userId: string): string {
  const secret = process.env.GOOGLE_OAUTH_STATE_SECRET!
  const sig = createHmac("sha256", secret).update(userId).digest("hex")
  return Buffer.from(`${userId}:${sig}`).toString("base64url")
}

export function verifyState(state: string): string | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8")
    const colonIdx = decoded.indexOf(":")
    if (colonIdx === -1) return null
    const userId = decoded.slice(0, colonIdx)
    const sig = decoded.slice(colonIdx + 1)
    if (!userId || !sig) return null
    const secret = process.env.GOOGLE_OAUTH_STATE_SECRET!
    const expected = createHmac("sha256", secret).update(userId).digest("hex")
    const sigBuf = Buffer.from(sig, "hex")
    const expectedBuf = Buffer.from(expected, "hex")
    if (sigBuf.length !== expectedBuf.length) return null
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null
    return userId
  } catch {
    return null
  }
}

export async function getGoogleClient(userId: string): Promise<OAuth2Client> {
  const conn = await prisma.googleConnection.findUnique({ where: { userId } })
  if (!conn) throw new Error(`No Google connection for user ${userId}`)

  const client = buildOAuthClient()
  client.setCredentials({ access_token: conn.accessToken, refresh_token: conn.refreshToken })

  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)
  if (conn.expiresAt < fiveMinutesFromNow) {
    try {
      const { credentials } = await client.refreshAccessToken()
      await prisma.googleConnection.update({
        where: { userId },
        data: {
          accessToken: credentials.access_token!,
          expiresAt: new Date(credentials.expiry_date!),
        },
      })
      client.setCredentials(credentials)
    } catch {
      await handleTokenRevoked(userId)
      throw new Error(`Google token revoked for user ${userId}`)
    }
  }

  return client
}

export async function handleTokenRevoked(userId: string): Promise<void> {
  await prisma.googleConnection.delete({ where: { userId } }).catch(() => {})
  const tgUser = await prisma.telegramUser.findUnique({
    where: { userId },
    select: { telegramChatId: true },
  })
  if (tgUser) {
    await sendTelegramMessage(
      parseInt(tgUser.telegramChatId, 10),
      "Heads up — your Google connection was disconnected. Reconnect from your dashboard when you're ready."
    )
  }
}
