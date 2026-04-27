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
      className="relative w-full aspect-[3/4] sm:aspect-[4/3] md:aspect-square lg:aspect-[4/3] overflow-hidden flex flex-col justify-center gap-2.5 sm:gap-4 p-4 sm:px-10 sm:pt-8 sm:pb-10 md:p-5 lg:p-10"
      style={{
        background: "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)",
        borderRadius: "24px",
      }}
    >
      {/* Bird iMessage bubble — always visible */}
      <div>
        <div
          className="text-[12px] sm:text-[15px]"
          style={{
            display: "inline-block",
            background: "#E9E9EB",
            borderRadius: "18px 18px 18px 4px",
            padding: "8px 12px",
            maxWidth: "80%",
            color: "#000000",
            lineHeight: 1.4,
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
          borderRadius: "20px",
          padding: "14px 16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "9px",
            background: "#dbeafe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "10px",
            flexShrink: 0,
          }}
        >
          <ListChecks size={17} color="#3b82f6" strokeWidth={1.8} />
        </div>

        <p
          className="text-[13px] sm:text-[17px]"
          style={{
            fontWeight: 600,
            color: "#0f172a",
            marginBottom: "12px",
            fontFamily: "var(--font-outfit)",
          }}
        >
          Action Items · Sarah
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {ITEMS.map((item, i) => (
            <div key={i} className={i === 2 ? "hidden sm:flex" : "flex"} style={{ alignItems: "flex-start", gap: "8px" }}>
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "3px",
                  border: "1.5px solid #d1d5db",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              />
              <div>
                <p
                  className="text-[12px] sm:text-[15px]"
                  style={{
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
                    className="text-[11px] sm:text-[12px]"
                    style={{
                      color: item.dueColor,
                      fontStyle: "italic",
                      fontFamily: "var(--font-dm-sans)",
                      marginTop: "3px",
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
