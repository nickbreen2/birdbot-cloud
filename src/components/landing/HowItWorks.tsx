const steps = [
  {
    num: 1,
    icon: "📋",
    title: "Pick Your Plan",
    desc: "Choose the plan that fits your needs. All plans include AI credits to get started.",
    highlighted: false,
  },
  {
    num: 2,
    icon: "🐦",
    title: "Set Up Your Bird",
    desc: "Name and customize your agent's personality. Make it truly yours.",
    highlighted: true,
  },
  {
    num: 3,
    icon: "💬",
    title: "Start Chatting",
    desc: "Your agent is live — message it from Telegram, our web app, or anywhere.",
    highlighted: false,
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 px-4" id="how-it-works">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-text-muted text-sm font-semibold tracking-widest uppercase font-sans mb-3">
            Getting Started
          </p>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-base">
            Live in under 5 minutes
          </h2>
        </div>

        {/* Steps */}
        <div className="flex flex-col md:flex-row items-stretch gap-0">
          {steps.map((step, i) => (
            <div key={step.num} className="flex flex-col md:flex-row items-center flex-1">
              {/* Card */}
              <div
                className={`flex-1 rounded-2xl p-7 text-center flex flex-col items-center gap-4 transition-all ${
                  step.highlighted
                    ? "glow-border-gold bg-panel"
                    : "border border-border bg-panel"
                }`}
              >
                {/* Number circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-sm border ${
                    step.highlighted
                      ? "bg-gold/10 border-gold/40 text-gold-light"
                      : "bg-panel-hover border-border text-text-dim"
                  }`}
                >
                  {step.num}
                </div>
                <span className="text-3xl">{step.icon}</span>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-text-base mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-text-dim text-sm leading-relaxed font-sans">
                    {step.desc}
                  </p>
                </div>
              </div>

              {/* Connector arrow (between steps) */}
              {i < steps.length - 1 && (
                <div className="flex items-center justify-center md:px-3 py-3 md:py-0">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-border rotate-90 md:rotate-0"
                  >
                    <path
                      d="M5 12h14M12 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
