import { UseCaseCard } from "@/components/landing/UseCaseCard"
import { MeetingSchedulingVisual } from "@/components/landing/visuals/MeetingSchedulingVisual"

export function UseCasesSection() {
  return (
    <section
      id="use-cases"
      style={{ background: "#0a0e1a", paddingTop: "96px", paddingBottom: "128px" }}
    >
      <div
        className="mx-auto px-8"
        style={{ maxWidth: "1200px" }}
      >
        {/* Header */}
        <div className="text-center" style={{ marginBottom: "96px" }}>
          <p
            className="uppercase font-semibold font-sans"
            style={{
              color: "#94a3b8",
              fontSize: "13px",
              letterSpacing: "0.15em",
              marginBottom: "16px",
            }}
          >
            WHAT BIRD DOES
          </p>
          <h2
            className="font-heading font-bold"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              color: "#f1f5f9",
              lineHeight: 1.1,
              marginBottom: "12px",
            }}
          >
            Three ways Bird helps.
          </h2>
          <p
            className="font-sans"
            style={{
              fontSize: "clamp(17px, 2vw, 20px)",
              color: "#94a3b8",
            }}
          >
            Text it. It handles the rest.
          </p>
        </div>

        {/* Cards stack */}
        <div>
          <UseCaseCard
            eyebrow="MEETING SCHEDULING"
            eyebrowColor="gold"
            headline="Your schedule, handled."
            body="Just text Bird the meeting details. It adds it to your calendar, sets reminders, and reschedules when plans change. No more back-and-forth."
            visual={<MeetingSchedulingVisual />}
          />
          {/* Cards 2 and 3 added in subsequent turns */}
        </div>
      </div>
    </section>
  )
}
