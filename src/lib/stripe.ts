import Stripe from "stripe"

// Lazy singleton — initialised at request time, never at build time
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable")
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _stripe
}

export const PLANS = {
  monthly: {
    name: "BirdBot",
    price: 9,
    displayPrice: 9,
    interval: "month" as const,
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID ?? "",
  },
  annual: {
    name: "BirdBot",
    price: 60,
    displayPrice: 5,
    interval: "year" as const,
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID ?? "",
  },
} as const

export type PlanKey = keyof typeof PLANS
