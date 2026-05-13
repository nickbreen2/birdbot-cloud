import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"
import { buildOAuthClient } from "@/lib/google"
import { sendTelegramMessage } from "@/lib/telegram"
import { decrypt } from "@/lib/tokenEncryption"

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // 1. Cancel Stripe subscription immediately so the user isn't charged again
    const subscription = await prisma.subscription.findUnique({
      where: { clerkUserId: userId },
      select: { stripeSubscriptionId: true, status: true },
    })

    if (subscription && subscription.status !== "canceled") {
      try {
        await getStripe().subscriptions.cancel(subscription.stripeSubscriptionId)
      } catch (err) {
        console.error("[account-delete] Stripe cancel failed for", userId, err)
      }
    }

    // 2. Revoke Google OAuth token so we don't hold credentials for a deleted user
    const googleConn = await prisma.googleConnection.findUnique({
      where: { userId },
      select: { refreshToken: true },
    })

    if (googleConn) {
      try {
        const client = buildOAuthClient()
        await client.revokeToken(decrypt(googleConn.refreshToken))
      } catch {
        // Token may already be invalid — proceed regardless
      }
    }

    // 3. Get MCP userToken before deleting McpConnection (Cloud* tables reference it)
    const mcpConn = await prisma.mcpConnection.findUnique({
      where: { clerkUserId: userId },
      select: { userToken: true },
    })

    // 4. Delete Cloud* records tied to the MCP userToken
    if (mcpConn) {
      await Promise.all([
        prisma.cloudSession.deleteMany({ where: { userToken: mcpConn.userToken } }),
        prisma.cloudDecision.deleteMany({ where: { userToken: mcpConn.userToken } }),
        prisma.cloudProject.deleteMany({ where: { userToken: mcpConn.userToken } }),
        prisma.projectBrief.deleteMany({ where: { userToken: mcpConn.userToken } }),
      ])
    }

    // 5. Send Telegram goodbye before the record is gone
    const tgUser = await prisma.telegramUser.findUnique({
      where: { userId },
      select: { telegramChatId: true },
    })

    if (tgUser) {
      try {
        await sendTelegramMessage(
          parseInt(tgUser.telegramChatId, 10),
          "Your BirdBot account has been deleted. This connection is now inactive. If you ever want to start fresh, you can sign up again at birdbot.ai."
        )
      } catch {
        // Don't block deletion if the message fails
      }
    }

    // 6. Delete all remaining user data — Entity deletion cascades to Relationship, Mention, Goal
    await Promise.all([
      prisma.pendingAction.deleteMany({ where: { userId } }),
      prisma.telegramPairingToken.deleteMany({ where: { userId } }),
      prisma.telegramUser.deleteMany({ where: { userId } }),
      prisma.googleConnection.deleteMany({ where: { userId } }),
      prisma.entity.deleteMany({ where: { userId } }),
      prisma.userPreferences.deleteMany({ where: { userId } }),
      prisma.subscription.deleteMany({ where: { clerkUserId: userId } }),
      prisma.mcpConnection.deleteMany({ where: { clerkUserId: userId } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[account-delete] error for", userId, err)
    return NextResponse.json({ error: "Failed to delete account data" }, { status: 500 })
  }
}
