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
    <div
      className="grid grid-cols-1 md:grid-cols-[42%_58%] overflow-hidden"
      style={{
        background: "#111827",
        border: "1px solid #1e2a45",
        borderRadius: "24px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
      }}
    >
      {/* Text side */}
      <div className="flex flex-col justify-center px-5 py-8 md:px-11 md:py-12">
        <p
          className="uppercase font-semibold font-sans"
          style={{
            color: eyebrowHex,
            fontSize: "12px",
            letterSpacing: "0.13em",
            marginBottom: "12px",
          }}
        >
          {eyebrow}
        </p>
        <h3
          className="font-heading font-semibold text-[clamp(1.4rem,4vw,2.25rem)] md:text-[1.3rem] lg:text-[clamp(1.4rem,4vw,2.25rem)]"
          style={{
            color: "#f1f5f9",
            lineHeight: 1.2,
            marginBottom: "14px",
          }}
        >
          {headline}
        </h3>
        <p
          className="font-sans"
          style={{
            fontSize: "clamp(14px, 1.5vw, 17px)",
            color: "#94a3b8",
            lineHeight: 1.65,
          }}
        >
          {body}
        </p>
      </div>

      {/* Visual side — flush to card edges */}
      <div className="flex items-center justify-center px-5 pb-8 pt-0 md:p-8 lg:p-10">
        {visual}
      </div>
    </div>
  )
}
