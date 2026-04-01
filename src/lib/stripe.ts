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
  starter: {
    name: "Starter",
    price: 19,
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? "",
    features: [
      "1 AI agent",
      "Telegram + WebChat",
      "Core skills",
      "$5 AI credits/mo",
      "Community support",
    ],
  },
  pro: {
    name: "Pro",
    price: 29,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    popular: true,
    features: [
      "1 AI agent",
      "All channels",
      "All skills",
      "$15 AI credits/mo",
      "Priority support",
      "Custom personality",
    ],
  },
  power: {
    name: "Power",
    price: 49,
    priceId: process.env.STRIPE_POWER_PRICE_ID ?? "",
    features: [
      "2 AI agents",
      "All channels",
      "All skills",
      "$25 AI credits/mo",
      "Priority support",
      "Custom personality",
      "Advanced analytics",
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS
