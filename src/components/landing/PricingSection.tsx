import Link from "next/link"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"

const plans = [
  {
    name: "Starter",
    price: 19,
    desc: "Everything you need to get your Bird flying.",
    features: [
      "1 AI agent",
      "Telegram + WebChat",
      "Core skills",
      "$5 AI credits/mo",
      "Community support",
    ],
    popular: false,
    cta: "Get Started",
  },
  {
    name: "Pro",
    price: 29,
    desc: "The full BirdBot experience, supercharged.",
    features: [
      "1 AI agent",
      "All channels",
      "All skills",
      "$15 AI credits/mo",
      "Priority support",
      "Custom personality",
    ],
    popular: true,
    cta: "Get Started",
  },
  {
    name: "Power",
    price: 49,
    desc: "Two agents, maximum capability, advanced analytics.",
    features: [
      "2 AI agents",
      "All channels",
      "All skills",
      "$25 AI credits/mo",
      "Priority support",
      "Custom personality",
      "Advanced analytics",
    ],
    popular: false,
    cta: "Get Started",
  },
]

export function PricingSection() {
  return (
    <section className="py-24 px-4" id="pricing">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-text-muted text-sm font-semibold tracking-widest uppercase font-sans mb-3">
            Pricing
          </p>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-base mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-text-dim font-sans">
            No surprise bills. Cancel anytime.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-7 flex flex-col gap-6 bg-panel transition-all ${
                plan.popular
                  ? "glow-border-blue"
                  : "border border-border card-glow"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge variant="gold" className="px-3 py-1 text-xs">
                    ⭐ Most Popular
                  </Badge>
                </div>
              )}

              {/* Plan header */}
              <div>
                <h3 className="font-heading font-bold text-xl text-text-base mb-1">
                  {plan.name}
                </h3>
                <p className="text-text-muted text-sm font-sans">{plan.desc}</p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1">
                <span
                  className={`font-heading font-black text-4xl ${
                    plan.popular ? "text-gradient-blue" : "text-text-base"
                  }`}
                >
                  ${plan.price}
                </span>
                <span className="text-text-muted text-sm font-sans">/month</span>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm font-sans text-text-dim">
                    <span className="text-blue-bright w-4 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href="/sign-up">
                <Button
                  variant={plan.popular ? "primary" : "outline"}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* BYOK note */}
        <p className="text-center text-text-muted text-sm font-sans mt-8">
          All plans include BYOK support — bring your own API key for Claude,
          GPT, or Gemini.
        </p>
      </div>
    </section>
  )
}
