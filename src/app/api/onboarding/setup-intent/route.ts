import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clerk = await clerkClient()
  const user = await clerk.users.getUser(userId)
  const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress

  const stripe = getStripe()

  // Find existing Stripe customer by email, or create one
  let customerId: string
  const existing = email
    ? await stripe.customers.list({ email, limit: 1 })
    : { data: [] }

  if (existing.data.length > 0) {
    customerId = existing.data[0].id
    if (existing.data[0].metadata?.clerkUserId !== userId) {
      await stripe.customers.update(customerId, { metadata: { clerkUserId: userId } })
    }
  } else {
    const customer = await stripe.customers.create(
      {
        email: email ?? undefined,
        metadata: { clerkUserId: userId },
      },
      { idempotencyKey: `customer-${userId}` }
    )
    customerId = customer.id
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: 'off_session',
    automatic_payment_methods: { enabled: true },
  })

  if (!setupIntent.client_secret) {
    return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 })
  }

  return NextResponse.json({
    clientSecret: setupIntent.client_secret,
    customerId,
  })
}
