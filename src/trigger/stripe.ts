import { task } from "@trigger.dev/sdk"
import type Stripe from "stripe"
import { prisma } from "@/lib/prisma"

// current_period_end is present at runtime but removed from TS types in API 2026-03-25.dahlia
type StripeSubscriptionWithPeriod = Stripe.Subscription & { current_period_end: number }

export const handleStripeCheckoutCompleted = task({
  id: "stripe-checkout-completed",
  retry: { maxAttempts: 5, factor: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 30_000 },
  run: async (payload: { session: Stripe.Checkout.Session }) => {
    const { session } = payload

    const clerkUserId = session.metadata?.userId
    if (!clerkUserId) throw new Error("Missing userId in session metadata")
    if (!session.customer) throw new Error("Missing customer on session")
    if (!session.subscription) throw new Error("Missing subscription on session")

    // Fetch full subscription from Stripe to get price and period details
    const { getStripe } = await import("@/lib/stripe")
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as unknown as StripeSubscriptionWithPeriod

    await prisma.subscription.upsert({
      where: { clerkUserId },
      create: {
        clerkUserId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
      update: {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })
  },
})

export const handleStripeSubscriptionCreated = task({
  id: "stripe-subscription-created",
  retry: { maxAttempts: 5, factor: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 30_000 },
  run: async (payload: { subscription: Stripe.Subscription }) => {
    const subscription = payload.subscription as StripeSubscriptionWithPeriod
    const { getStripe } = await import("@/lib/stripe")

    // clerkUserId lives on the customer, not the subscription
    const customer = await getStripe().customers.retrieve(subscription.customer as string)
    if (customer.deleted) return
    const clerkUserId = customer.metadata?.clerkUserId
    if (!clerkUserId) return

    await prisma.subscription.upsert({
      where: { clerkUserId },
      create: {
        clerkUserId,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
      update: {
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })
  },
})

export const handleStripeSubscriptionUpdated = task({
  id: "stripe-subscription-updated",
  retry: { maxAttempts: 5, factor: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 30_000 },
  run: async (payload: { subscription: Stripe.Subscription }) => {
    const subscription = payload.subscription as StripeSubscriptionWithPeriod

    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })
  },
})

export const handleStripeSubscriptionDeleted = task({
  id: "stripe-subscription-deleted",
  retry: { maxAttempts: 5, factor: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 30_000 },
  run: async (payload: { subscription: Stripe.Subscription }) => {
    const { subscription } = payload

    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: "canceled" },
    })
  },
})
