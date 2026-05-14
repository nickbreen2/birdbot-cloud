"use client"

import { useState } from "react"
import { PLANS } from "@/lib/stripe"
import { PricingButton } from "./PricingButton"

const FEATURES = [
  "Telegram as your personal AI home",
  "Persistent memory & knowledge graph",
  "Google Calendar, Gmail & Drive integration",
  "Daily briefings & smart check-ins",
  "MCP integration for dev tools",
  "Unlimited conversations",
  "Cancel anytime",
]

export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")

  const plan = PLANS[billing]

  return (
    <section className="py-24 px-4" id="pricing">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-text-muted text-xs font-bold tracking-widest uppercase font-sans mb-3">
            Pricing
          </p>
          <h2 className="font-heading font-extrabold text-3xl text-text-base mb-2">
            Simple, transparent pricing
          </h2>
          <p className="text-text-dim font-sans text-sm">
            No surprise bills. Cancel anytime.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setBilling("monthly")}
            className={`text-sm font-sans font-semibold px-4 py-1.5 rounded-full transition-colors ${
              billing === "monthly"
                ? "bg-blue-500/15 text-blue-bright border border-blue-500/30"
                : "text-text-muted hover:text-text-base"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`flex items-center gap-2 text-sm font-sans font-semibold px-4 py-1.5 rounded-full transition-colors ${
              billing === "annual"
                ? "bg-blue-500/15 text-blue-bright border border-blue-500/30"
                : "text-text-muted hover:text-text-base"
            }`}
          >
            Annual
            <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold">
              Save 44%
            </span>
          </button>
        </div>

        {/* Plan card */}
        <div className="rounded-2xl p-8 flex flex-col bg-panel glow-border-blue">
          <p className="text-xs font-bold tracking-widest uppercase font-sans mb-1 text-blue-bright">
            BirdBot
          </p>
          <p className="text-text-muted text-sm font-sans leading-snug mb-5">
            Your personal AI assistant — always on, always learning
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-1 mb-1">
            <span className="font-heading font-black leading-none tracking-tight text-gradient-blue text-5xl">
              ${plan.displayPrice}
            </span>
            <span className="text-text-muted text-sm font-sans self-end mb-1.5">
              /mo
            </span>
          </div>

          {billing === "annual" && (
            <p className="text-text-muted text-xs font-sans mb-5">
              Billed $60/year
            </p>
          )}
          {billing === "monthly" && <div className="mb-5" />}

          <PricingButton priceId={plan.priceId} isPro={true} />

          <p className="text-center text-xs text-text-muted font-sans mb-5">
            Cancel anytime
          </p>

          <div className="h-px bg-border mb-4" />

          <ul className="flex flex-col gap-2.5">
            {FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2.5 text-sm font-sans text-text-muted font-normal"
              >
                <span className="text-blue-bright flex-shrink-0 mt-px">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-text-muted text-xs font-sans mt-6">
          Your data is private and never used for training.
        </p>
      </div>
    </section>
  )
}
