const leftItems = [
  { text: "Find a server" },
  { text: "Set up the environment" },
  { text: "Something breaks" },
  { text: "Give up", highlight: true },
]

const rightItems = [
  { text: "You don't need a server." },
  { text: "You don't need to configure anything." },
  { text: "You don't need to maintain anything.", highlight: true },
]

function TrafficLights() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
      <span className="w-3 h-3 rounded-full bg-[#eab308]" />
      <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
    </div>
  )
}

export function WhyBirdBot() {
  return (
    <section id="how-we-differ" className="py-24 px-4" style={{ background: "#0a0e1a" }}>
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-16">
          <p className="text-text-muted text-sm font-semibold tracking-widest uppercase font-sans mb-3">
            How we differ
          </p>
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-text-base leading-tight">
          Why most people never actually use OpenClaw
        </h2>
        </div>

        {/* Comparison layout */}
        <div className="flex flex-col md:flex-row items-start gap-6 md:gap-4">

          {/* ── LEFT: Without BirdBot ── */}
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-5">
              <img src="/Openclaw.svg" alt="OpenClaw" className="h-8 w-auto" />
              <p
                className="font-heading font-bold text-xs tracking-[0.25em] uppercase"
                style={{ color: "#ef4444" }}
              >
                Using OpenClaw
              </p>
            </div>

            {/* Terminal window */}
            <div
              className="rounded-xl border overflow-hidden"
              style={{ background: "#111827", borderColor: "#1e2a45" }}
            >
              {/* Title bar */}
              <div
                className="flex items-center px-4 py-3"
                style={{ background: "#1e2a45" }}
              >
                <TrafficLights />
              </div>

              {/* Terminal body */}
              <div className="px-5 py-4 font-mono text-sm leading-relaxed space-y-3">
                <p style={{ color: "#94a3b8" }}>
                  <span style={{ color: "#22c55e" }}>$</span><span style={{ color: "#f1f5f9" }}> $</span>&nbsp;git clone openclaw &amp;&amp; cd openclaw
                </p>
                <p style={{ color: "#94a3b8" }}>
                  <span style={{ color: "#22c55e" }}>$</span><span style={{ color: "#f1f5f9" }}> $</span> docker compose up
                </p>
                <p style={{ color: "#f87171" }}>ERROR: port 5432 already in use</p>
                <p style={{ color: "#94a3b8" }}>
                  <span style={{ color: "#22c55e" }}>$</span><span style={{ color: "#f1f5f9" }}> $</span> pip install -r requirements.txt
                </p>
                <p style={{ color: "#f87171" }}>ERROR: python 3.9 required, found 3.12</p>
                <p style={{ color: "#f87171" }}>Build failed. 14 errors.</p>
              </div>
            </div>

            {/* X list */}
            <ul className="mt-5 space-y-3">
              {leftItems.map((item) => (
                <li
                  key={item.text}
                  className="flex items-center gap-3 font-heading text-base"
                  style={
                    item.highlight
                      ? { color: "#ef4444", fontWeight: 700 }
                      : { color: "#94a3b8" }
                  }
                >
                  <span
                    className="font-bold flex-shrink-0"
                    style={item.highlight ? { color: "#ef4444" } : { color: "#64748b" }}
                  >
                    ✕
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Arrow: down on mobile, right on desktop ── */}
          <div className="flex-shrink-0 flex justify-center" aria-hidden>
            {/* Mobile: down arrow */}
            <span
              className="md:hidden"
              style={{ color: "#3b82f6", fontSize: "2rem" }}
            >
              ↓
            </span>
            {/* Desktop: right arrow */}
            <span
              className="hidden md:inline self-center"
              style={{ color: "#3b82f6", fontSize: "2rem", paddingTop: "3rem" }}
            >
              →
            </span>
          </div>

          {/* ── RIGHT: With BirdBot ── */}
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-5">
              <img src="/BirdBot-Icon-mark1.svg" alt="BirdBot" className="h-8 w-auto" />
              <p
                className="font-heading font-bold text-xs tracking-[0.25em] uppercase"
                style={{ color: "#3b82f6" }}
              >
                Using BirdBot
              </p>
            </div>
          <div
            className="rounded-2xl p-6 border"
            style={{ background: "#151c2e", borderColor: "#1e2a45" }}
          >

            {/* Terminal window */}
            <div
              className="rounded-xl border overflow-hidden"
              style={{ background: "#111827", borderColor: "#1e2a45" }}
            >
              {/* Title bar */}
              <div
                className="flex items-center px-4 py-3"
                style={{ background: "#1e2a45" }}
              >
                <TrafficLights />
              </div>

              {/* Terminal body */}
              <div className="px-5 py-4 font-mono text-sm space-y-3">
                <p className="flex items-center gap-2" style={{ color: "#22c55e" }}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "#22c55e" }} />
                  BirdBot is running
                </p>

                {/* Placeholder blurred rows */}
                <div className="space-y-2 pt-1">
                  <div className="flex gap-2">
                    <div className="h-4 rounded" style={{ width: "38%", background: "#1a3a2a", opacity: 0.8 }} />
                    <div className="h-4 rounded" style={{ width: "30%", background: "#1a2e3a", opacity: 0.8 }} />
                    <div className="h-4 rounded" style={{ width: "24%", background: "#1a2a3a", opacity: 0.8 }} />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-4 rounded" style={{ width: "55%", background: "#1a2a3a", opacity: 0.7 }} />
                    <div className="h-4 rounded" style={{ width: "35%", background: "#1a2e3a", opacity: 0.7 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Success heading */}
            <h3
              className="font-heading font-black text-white mt-6 mb-4"
              style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", letterSpacing: "-0.01em" }}
            >
              BirdBot skips all of that.
            </h3>

            {/* Checkmark list */}
            <ul className="space-y-3">
              {rightItems.map((item) => (
                <li
                  key={item.text}
                  className="flex items-center gap-3 font-heading text-base"
                  style={{ color: item.highlight ? "#3b82f6" : "#f1f5f9" }}
                >
                  <span style={{ color: item.highlight ? "#3b82f6" : "#94a3b8" }}>✓</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
          </div>
        </div>
      </div>
    </section>
  )
}
