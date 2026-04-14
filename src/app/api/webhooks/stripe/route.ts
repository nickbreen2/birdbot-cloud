import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe"
import { tasks } from "@trigger.dev/sdk"
import type {
  handleStripeCheckoutCompleted,
  handleStripeSubscriptionUpdated,
  handleStripeSubscriptionDeleted,
} from "@/trigger/stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return new NextResponse("Missing stripe-signature header", { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Missing STRIPE_WEBHOOK_SECRET")
    return new NextResponse("Webhook secret not configured", { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature"
    console.error("Webhook signature verification failed:", message)
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      await tasks.trigger<typeof handleStripeCheckoutCompleted>(
        "stripe-checkout-completed",
        { session }
      )
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      await tasks.trigger<typeof handleStripeSubscriptionUpdated>(
        "stripe-subscription-updated",
        { subscription }
      )
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      await tasks.trigger<typeof handleStripeSubscriptionDeleted>(
        "stripe-subscription-deleted",
        { subscription }
      )
      break
    }

    default:
      break
  }

  return new NextResponse("OK", { status: 200 })
}
