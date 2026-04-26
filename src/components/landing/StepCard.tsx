import { ReactNode } from "react"

type StepCardProps = {
  number: string
  title: string
  body: string
  visual: ReactNode
}

export function StepCard({ number, title, body, visual }: StepCardProps) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24,
        overflow: "hidden",
        minHeight: 420,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Visual area */}
      <div
        style={{
          flexShrink: 0,
        height: 260,
          padding: "32px 32px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(160deg, rgba(37,99,235,0.06) 0%, rgba(125,211,252,0.04) 50%, transparent 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {visual}
      </div>

      {/* Text area */}
      <div style={{ flex: 1, padding: "24px 28px 32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
              color: "#94a3b8",
              flexShrink: 0,
            }}
          >
            {number}
          </div>
          <h3
            className="font-heading"
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#f1f5f9",
              lineHeight: 1.25,
              margin: 0,
            }}
          >
            {title}
          </h3>
        </div>
        <p
          className="font-sans"
          style={{
            fontSize: 15,
            color: "#94a3b8",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {body}
        </p>
      </div>
    </div>
  )
}
