import { prisma } from "./prisma"

export async function isSubscribed(clerkUserId: string, userEmail?: string | null): Promise<boolean> {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)

  if (userEmail && adminEmails.includes(userEmail)) return true

  const subscription = await prisma.subscription.findUnique({
    where: { clerkUserId },
    select: { status: true, currentPeriodEnd: true },
  })

  return (
    (subscription?.status === "active" || subscription?.status === "trialing") &&
    subscription.currentPeriodEnd > new Date()
  )
}
