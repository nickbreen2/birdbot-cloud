const features = [
  {
    icon: "⚡",
    title: "Automate Everything",
    desc: "Emails, scheduling, reminders, and repetitive tasks handled automatically — so you can focus on what matters.",
  },
  {
    icon: "🌐",
    title: "Browse the Web",
    desc: "Fill forms, scrape data, monitor prices, and navigate complex websites — just like a real assistant would.",
  },
  {
    icon: "💻",
    title: "Code & Dev Tools",
    desc: "Review code, generate tests, refactor functions, and manage your GitHub repos without leaving chat.",
  },
  {
    icon: "🔗",
    title: "Connect Your Apps",
    desc: "Slack, Discord, GitHub, databases, any API — your Bird integrates with your entire stack out of the box.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 px-4" id="features">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-text-muted text-sm font-semibold tracking-widest uppercase font-sans mb-3">
            Capabilities
          </p>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-base max-w-xl mx-auto leading-tight">
            An always-on AI that works across your entire digital life
          </h2>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="card-glow rounded-2xl p-7 bg-panel flex gap-5 items-start group cursor-default"
            >
              <div className="w-11 h-11 rounded-xl bg-blue/10 border border-blue/20 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-blue/20 transition-colors">
                {f.icon}
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-text-base mb-1.5">
                  {f.title}
                </h3>
                <p className="text-text-dim text-sm leading-relaxed font-sans">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
