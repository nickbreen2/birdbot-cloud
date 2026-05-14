import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { getStripe, PLANS } from "@/lib/stripe"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

const ALLOWED_PRICE_IDS = new Set(
  Object.values(PLANS)
    .map((p) => p.priceId)
    .filter(Boolean)
)

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json() as { priceId?: string }
  const { priceId } = body

  if (!priceId) {
    return NextResponse.json({ error: "Missing priceId" }, { status: 400 })
  }

  if (!ALLOWED_PRICE_IDS.has(priceId)) {
    return NextResponse.json({ error: "Invalid priceId" }, { status: 400 })
  }

  const clerk = await clerkClient()
  const user = await clerk.users.getUser(userId)
  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/dashboard?checkout=success&step=2`,
      cancel_url: `${APP_URL}/dashboard`,
      metadata: { userId },
      ...(email ? { customer_email: email } : {}),
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
