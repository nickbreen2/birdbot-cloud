import type { ReactNode } from "react"

type UseCaseCardProps = {
  eyebrow: string
  eyebrowColor: "gold" | "blue"
  headline: string
  body: string
  visual: ReactNode
}

export function UseCaseCard({ eyebrow, eyebrowColor, headline, body, visual }: UseCaseCardProps) {
  const eyebrowHex = eyebrowColor === "gold" ? "#eab308" : "#3b82f6"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-12 lg:gap-16 items-center">
      {/* Text side */}
      <div>
        <p
          className="uppercase font-semibold font-sans"
          style={{
            color: eyebrowHex,
            fontSize: "13px",
            letterSpacing: "0.15em",
            marginBottom: "12px",
          }}
        >
          {eyebrow}
        </p>
        <h3
          className="font-heading font-semibold"
          style={{
            fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
            color: "#f1f5f9",
            lineHeight: 1.15,
            marginBottom: "24px",
          }}
        >
          {headline}
        </h3>
        <p
          className="font-sans"
          style={{
            fontSize: "clamp(16px, 1.8vw, 18px)",
            color: "#94a3b8",
            lineHeight: 1.6,
          }}
        >
          {body}
        </p>
      </div>

      {/* Visual side */}
      <div>{visual}</div>
    </div>
  )
}
