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
  lite: {
    name: "Lite",
    price: 19,
    priceId: process.env.STRIPE_LITE_PRICE_ID ?? "",
    features: [
      "1 BirdBot agent",
      "1 channel & WebChat",
      "Core skills",
      "Standard AI models",
      "Custom personality & memory",
      "Community support",
    ],
  },
  pro: {
    name: "Pro",
    price: 39,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    popular: true,
    features: [
      "1 BirdBot agent",
      "All channels — Telegram, Discord, Slack",
      "All skills + marketplace",
      "All major AI models",
      "Custom personality & memory",
      "Daily backups",
      "Priority support",
    ],
  },
  max: {
    name: "Max",
    price: 79,
    priceId: process.env.STRIPE_MAX_PRICE_ID ?? "",
    features: [
      "3 BirdBot agents",
      "All channels — Telegram, Discord, Slack",
      "All skills + early access",
      "All AI models incl. frontier",
      "Custom personality & memory",
      "Daily backups",
      "Advanced analytics",
      "API access",
      "Dedicated support",
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS
