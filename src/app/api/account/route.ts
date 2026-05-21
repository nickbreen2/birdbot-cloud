import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
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

    // 3. Send Telegram goodbye before the record is gone
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

    // 4. Delete all user data atomically — Entity deletion cascades to Relationship, Mention, Goal
    await prisma.$transaction(async (tx) => {
      const mcpConn = await tx.mcpConnection.findUnique({
        where: { clerkUserId: userId },
        select: { userToken: true },
      })

      if (mcpConn) {
        await Promise.all([
          tx.cloudSession.deleteMany({ where: { userToken: mcpConn.userToken } }),
          tx.cloudDecision.deleteMany({ where: { userToken: mcpConn.userToken } }),
          tx.cloudProject.deleteMany({ where: { userToken: mcpConn.userToken } }),
          tx.projectBrief.deleteMany({ where: { userToken: mcpConn.userToken } }),
        ])
      }

      await Promise.all([
        tx.pendingAction.deleteMany({ where: { userId } }),
        tx.telegramPairingToken.deleteMany({ where: { userId } }),
        tx.telegramUser.deleteMany({ where: { userId } }),
        tx.googleConnection.deleteMany({ where: { userId } }),
        tx.entity.deleteMany({ where: { userId } }),
        tx.userPreferences.deleteMany({ where: { userId } }),
        tx.subscription.deleteMany({ where: { clerkUserId: userId } }),
        tx.mcpConnection.deleteMany({ where: { clerkUserId: userId } }),
      ])
    })

    // 5. Delete the Clerk user (server-side, avoids client SDK permission issues)
    const clerk = await clerkClient()
    await clerk.users.deleteUser(userId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[account-delete] error for", userId, err)
    return NextResponse.json({ error: "Failed to delete account data" }, { status: 500 })
  }
}
