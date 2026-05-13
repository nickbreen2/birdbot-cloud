import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getStripe, PLANS } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { paymentMethodId?: string; customerId?: string; plan?: string }
  const { paymentMethodId, customerId, plan } = body

  if (!paymentMethodId || !customerId || !plan) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const planConfig = plan === 'monthly' ? PLANS.monthly : plan === 'annual' ? PLANS.annual : null
  if (!planConfig) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const stripe = getStripe()

  // Verify this Stripe customer belongs to the authenticated user
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted || customer.metadata?.clerkUserId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })

  // Set as default payment method
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  })

  // Create subscription with 7-day trial
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: planConfig.priceId }],
    trial_period_days: 7,
    payment_settings: {
      payment_method_types: ['card'],
      save_default_payment_method: 'on_subscription',
    },
  })

  // In Stripe v21, current_period_end lives on each SubscriptionItem.
  // For a trialing subscription, use trial_end; fall back to item-level period end.
  const periodEndTs =
    subscription.trial_end ??
    subscription.items.data[0]?.current_period_end ??
    0

  if (periodEndTs === 0) {
    return NextResponse.json({ error: 'Invalid subscription period from Stripe' }, { status: 500 })
  }

  const periodEnd = new Date(periodEndTs * 1000)

  // Write to Prisma immediately (don't wait for webhook — avoids race condition on redirect)
  await prisma.subscription.upsert({
    where: { clerkUserId: userId },
    create: {
      clerkUserId: userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: planConfig.priceId,
      status: subscription.status,
      currentPeriodEnd: periodEnd,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: planConfig.priceId,
      status: subscription.status,
      currentPeriodEnd: periodEnd,
    },
  })

  // Mark onboarding complete in Clerk
  const clerk = await clerkClient()
  const user = await clerk.users.getUser(userId)
  await clerk.users.updateUser(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      onboardingComplete: true,
      plan,
    },
  })

  return NextResponse.json({ ok: true })
}
