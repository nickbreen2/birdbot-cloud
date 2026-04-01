import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe"

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
      console.log("✅ Checkout completed:", {
        sessionId: session.id,
        customerId: session.customer,
        subscriptionId: session.subscription,
        userId: session.metadata?.userId,
      })
      // TODO: Store subscription info in database (e.g. Supabase)
      // await db.subscriptions.upsert({ userId: session.metadata?.userId, ... })
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      console.log("❌ Subscription cancelled:", {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
      })
      // TODO: Update user record to mark as unsubscribed
      // await db.subscriptions.update({ subscriptionId: subscription.id, status: 'cancelled' })
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      console.log("🔄 Subscription updated:", {
        subscriptionId: subscription.id,
        status: subscription.status,
      })
      // TODO: Update subscription status in database
      break
    }

    default:
      // Unhandled event type — ignore
      break
  }

  return new NextResponse("OK", { status: 200 })
}
