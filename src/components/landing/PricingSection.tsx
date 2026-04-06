const BOLD_FEATURES = [
  "Zero setup, instant access",
  "Personal AI assistant, 24/7",
  "Auto-updates, zero maintenance",
]

const plans = [
  {
    name: "Lite",
    price: 19,
    desc: "For personal projects and getting started",
    features: [
      "1 BirdBot agent",
      "1 channel & WebChat",
      "Core skills",
      "Standard AI models",
      "Custom personality & memory",
      "Fully private & encrypted",
      "Community support",
    ],
    pro: false,
  },
  {
    name: "Pro",
    price: 39,
    desc: "For power users who rely on AI daily",
    features: [
      "1 BirdBot agent",
      "All channels — Telegram, Discord, Slack",
      "All skills + marketplace",
      "All major AI models",
      "Custom personality & memory",
      "Fully private & encrypted",
      "Daily backups",
      "Priority support",
    ],
    pro: true,
  },
  {
    name: "Max",
    price: 79,
    desc: "For heavy workloads and maximum performance",
    features: [
      "3 BirdBot agents",
      "All channels — Telegram, Discord, Slack",
      "All skills + early access",
      "All AI models incl. frontier",
      "Custom personality & memory",
      "Fully private & encrypted",
      "Daily backups",
      "Advanced analytics",
      "API access",
      "Dedicated support",
    ],
    pro: false,
  },
]

export function PricingSection() {
  return (
    <section className="py-24 px-4" id="pricing">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
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

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-7 flex flex-col bg-panel ${
                plan.pro
                  ? "glow-border-blue"
                  : "border border-border"
              }`}
            >
              {/* Plan name */}
              <p
                className={`text-xs font-bold tracking-widest uppercase font-sans mb-1 ${
                  plan.pro ? "text-blue-bright" : "text-text-muted"
                }`}
              >
                {plan.name}
              </p>

              {/* Description */}
              <p
                className="text-text-muted text-sm font-sans leading-snug mb-5"
                style={{ minHeight: "2.9em" }}
              >
                {plan.desc}
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-5">
                <span
                  className={`font-heading font-black leading-none tracking-tight ${
                    plan.pro ? "text-gradient-blue text-5xl" : "text-text-base text-5xl"
                  }`}
                >
                  ${plan.price}
                </span>
                <span className="text-text-muted text-sm font-sans self-end mb-1.5">
                  /mo
                </span>
              </div>

              {/* Button */}
              <button
                disabled
                className={`w-full py-3 rounded-xl text-sm font-bold tracking-wide cursor-default mb-2 ${
                  plan.pro
                    ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white"
                    : "bg-blue-500/10 border border-blue-500/30 text-blue-bright"
                }`}
              >
                Coming Soon
              </button>

              {/* Cancel note */}
              <p className="text-center text-xs text-text-muted font-sans mb-5">
                Cancel anytime
              </p>

              {/* Divider */}
              <div className="h-px bg-border mb-4" />

              {/* Features */}
              <ul className="flex flex-col gap-2.5">
                {BOLD_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm font-sans text-text-base font-semibold">
                    <span className="text-blue-bright flex-shrink-0 mt-px">✓</span>
                    {f}
                  </li>
                ))}
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm font-sans text-text-muted font-normal">
                    <span className="text-blue-bright flex-shrink-0 mt-px">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* BYOK note */}
        <p className="text-center text-text-muted text-xs font-sans mt-6">
          Every plan runs on its own secure, isolated container with encrypted access.
        </p>
      </div>
    </section>
  )
}
