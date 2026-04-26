import { ListChecks } from "lucide-react"

const ITEMS = [
  {
    text: "Draft proposal for Sarah's team",
    due: "Due Today EOD",
    dueColor: "#dc2626",
  },
  {
    text: "Send proposal to Sarah",
    due: "Due August 18th",
    dueColor: "#6b7280",
  },
  {
    text: "Follow up with Sarah next week",
    due: null,
    dueColor: null,
  },
] as const

export function ActionItemsVisual() {
  return (
    <div
      className="relative w-full aspect-[2/3] sm:aspect-[4/3] overflow-hidden flex flex-col justify-start sm:justify-center lg:block p-5 sm:pt-8 sm:px-12 sm:pb-12"
      style={{
        background: "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)",
        borderRadius: "24px",
      }}
    >
      {/* Bird iMessage bubble — left-aligned (Bird initiating) */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "inline-block",
            background: "#E9E9EB",
            borderRadius: "18px 18px 18px 4px",
            padding: "10px 14px",
            maxWidth: "70%",
            color: "#000000",
            fontSize: "15px",
            lineHeight: "1.4",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          Reminder: proposal draft due to Sarah today.
        </div>
      </div>

      {/* Action items card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "24px",
          padding: "20px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "#dbeafe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px",
            flexShrink: 0,
          }}
        >
          <ListChecks size={20} color="#3b82f6" strokeWidth={1.8} />
        </div>

        {/* Header */}
        <p
          style={{
            fontSize: "17px",
            fontWeight: 600,
            color: "#0f172a",
            marginBottom: "16px",
            fontFamily: "var(--font-outfit)",
          }}
        >
          Action Items · Sarah
        </p>

        {/* Checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {ITEMS.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              {/* Checkbox */}
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "3px",
                  border: "1.5px solid #d1d5db",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              />
              <div>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "#0f172a",
                    fontFamily: "var(--font-dm-sans)",
                    lineHeight: 1.35,
                  }}
                >
                  {item.text}
                </p>
                {item.due && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: item.dueColor,
                      fontStyle: "italic",
                      fontFamily: "var(--font-dm-sans)",
                      marginTop: "4px",
                    }}
                  >
                    {item.due}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
