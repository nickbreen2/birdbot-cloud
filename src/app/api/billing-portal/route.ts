import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export function resolveCustomerId(stripeCustomerId: unknown): string | null {
  if (typeof stripeCustomerId === 'string' && stripeCustomerId.length > 0) {
    return stripeCustomerId
  }
  return null
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const sub = await prisma.subscription.findUnique({ where: { clerkUserId: userId } })
    if (!sub) return NextResponse.json({ error: 'No subscription found' }, { status: 404 })

    const customerId = resolveCustomerId(sub.stripeCustomerId)
    if (!customerId) return NextResponse.json({ error: 'Invalid customer' }, { status: 500 })

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/dashboard`,
    })

    if (!session.url) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
