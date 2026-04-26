import { StepCard } from "./StepCard"
import { PickHomeVisual } from "./visuals/PickHomeVisual"
import { IntegrateVisual } from "./visuals/IntegrateVisual"

export function HowItWorksSection() {
  return (
    <section id="how-it-works" style={{ padding: "96px 32px 112px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: 88 }}>
          <p
            className="font-sans"
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#eab308",
              marginBottom: 16,
            }}
          >
            HOW IT WORKS
          </p>
          <h2
            className="font-heading font-bold text-3xl md:text-4xl"
            style={{
              color: "#f1f5f9",
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            Get started in seconds.
          </h2>
          <p
            className="font-sans"
            style={{
              fontSize: 18,
              color: "#94a3b8",
              lineHeight: 1.6,
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            Bird drafts your email, preps your meetings, and handles the busywork while you go about your day.
          </p>
        </div>

        {/* Cards row — three columns on desktop, stacked on mobile */}
        <div className="hiw-cards">
          <StepCard
            number="1"
            title="Pick a home for Bird"
            body="Bird lives in your messaging app. Just text it like a friend."
            visual={<PickHomeVisual />}
          />
          <StepCard
            number="2"
            title="Integrate your tools"
            body="Connect Bird to the apps you already use. It handles the rest."
            visual={<IntegrateVisual />}
          />
        </div>

      </div>
    </section>
  )
}
