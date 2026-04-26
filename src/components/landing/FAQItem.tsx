import { ChevronDown } from "lucide-react"

interface FAQItemProps {
  question: string
  answer: string
  expanded: boolean
  onToggle: () => void
}

export function FAQItem({ question, answer, expanded, onToggle }: FAQItemProps) {
  return (
    <div
      onClick={onToggle}
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 16,
        padding: "20px 24px",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h3
          className="font-sans"
          style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9", margin: 0, lineHeight: 1.4 }}
        >
          {question}
        </h3>
        <ChevronDown
          size={18}
          color="#94a3b8"
          style={{
            flexShrink: 0,
            transition: "transform 0.25s ease",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </div>
      <div
        style={{
          maxHeight: expanded ? 500 : 0,
          overflow: "hidden",
          transition: "max-height 0.25s ease",
        }}
      >
        <p
          className="font-sans"
          style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6, marginTop: 12, marginBottom: 0 }}
        >
          {answer}
        </p>
      </div>
    </div>
  )
}
