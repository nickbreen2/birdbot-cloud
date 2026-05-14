import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { PLANS } from '@/lib/stripe'

export function resolvePlanLabel(stripePriceId: string): string {
  if (stripePriceId === PLANS.monthly.priceId) return 'Monthly · $9 / mo'
  if (stripePriceId === PLANS.annual.priceId)  return 'Annual · $60 / yr'
  return 'BirdBot Pro'
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const sub = await prisma.subscription.findUnique({ where: { clerkUserId: userId } })
    if (!sub) return NextResponse.json({ error: 'No subscription found' }, { status: 404 })

    return NextResponse.json({
      plan: resolvePlanLabel(sub.stripePriceId),
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
