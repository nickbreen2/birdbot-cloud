import { UseCaseCard } from "@/components/landing/UseCaseCard"
import { MeetingSchedulingVisual } from "@/components/landing/visuals/MeetingSchedulingVisual"
import { EmailTriageVisual } from "@/components/landing/visuals/EmailTriageVisual"

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
            WHAT YOUR BIRD CAN DO FOR YOU
          </p>
          <h2
            className="font-heading font-bold text-3xl md:text-4xl text-text-base leading-tight"
            style={{ marginBottom: "12px" }}
          >
            Ways Your Bird can Assist you
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
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <UseCaseCard
            eyebrow="MEETING SCHEDULING"
            eyebrowColor="gold"
            headline="Your schedule, handled."
            body="Just text Bird the meeting details. It adds it to your calendar, sets reminders, and reschedules when plans change. No more back-and-forth."
            visual={<MeetingSchedulingVisual />}
          />
          <UseCaseCard
            eyebrow="EMAIL TRIAGE & DRAFTING"
            eyebrowColor="blue"
            headline="Your inbox, organized. Your replies, drafted."
            body="Bird labels every email and drafts replies in your voice. Just review, edit if needed, and hit send. Important emails get surfaced straight to you via text so you never miss what matters."
            visual={<EmailTriageVisual />}
          />
          {/* Card 3 added in subsequent turn */}
        </div>
      </div>
    </section>
  )
}
