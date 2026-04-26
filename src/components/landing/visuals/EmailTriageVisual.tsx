import Image from "next/image"

const INBOX_ROWS = [
  { sender: "Alex Rivera",  label: "Urgent",      labelType: "urgent",      preview: "Client deal closing today, need you" },
  { sender: "Jamie, me",    label: "Needs reply", labelType: "needs-reply", preview: "Can you review the updated proposal?" },
  { sender: "Stripe",       label: "Urgent",      labelType: "urgent",      preview: "Action required on your account" },
  { sender: "Priya Nair",   label: "Urgent",      labelType: "urgent",      preview: "Legal doc needs your sign-off ASAP" },
  { sender: "Notion",       label: "Urgent",      labelType: "urgent",      preview: "Your workspace export is ready" },
] as const

export function EmailTriageVisual() {
  return (
    <div
      className="relative w-full aspect-[2/3] sm:aspect-[4/3] overflow-hidden flex flex-col justify-start sm:justify-center lg:block p-5 sm:p-12"
      style={{
        background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
        borderRadius: "24px",
      }}
    >
      {/* User iMessage bubble — top right */}
      <div className="flex justify-end mb-4">
        <div
          style={{
            background: "#007AFF",
            borderRadius: "18px 18px 4px 18px",
            padding: "10px 14px",
            maxWidth: "70%",
            color: "#ffffff",
            fontSize: "15px",
            lineHeight: "1.4",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          Label my inbox and draft a reply to Matt
        </div>
      </div>

      {/* Composition: inbox card + drafted email card */}
      <div className="relative flex justify-center lg:block">
        {/* Inbox card — ~60% width, in flow */}
        <div
          className="hidden lg:block"
          style={{
            width: "62%",
            background: "#ffffff",
            borderRadius: "20px",
            padding: "16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.04)",
          }}
        >
          {/* Tab row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "12px",
              paddingBottom: "10px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            {/* Active tab */}
            <div style={{ position: "relative", paddingBottom: "4px" }}>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#0f172a",
                  fontFamily: "var(--font-dm-sans)",
                  whiteSpace: "nowrap",
                }}
              >
                Urgent / Needs reply
              </span>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: "#ef4444",
                  borderRadius: "1px",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "#94a3b8",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              FYI
            </span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "#94a3b8",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              ...
            </span>
          </div>

          {/* Email rows */}
          {INBOX_ROWS.map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 0",
                borderBottom: i < INBOX_ROWS.length - 1 ? "1px solid #f8fafc" : "none",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0f172a",
                  fontFamily: "var(--font-dm-sans)",
                  whiteSpace: "nowrap",
                  minWidth: "72px",
                }}
              >
                {row.sender}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  padding: "2px 7px",
                  borderRadius: "99px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  background: row.labelType === "urgent" ? "#fee2e2" : "#f1f5f9",
                  color: row.labelType === "urgent" ? "#dc2626" : "#475569",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                {row.label}
              </span>
              <span
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  fontFamily: "var(--font-dm-sans)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.preview}
              </span>
            </div>
          ))}
        </div>

        {/* Drafted email card — absolute on desktop, full-width centered on mobile */}
        <div
          className="w-full lg:absolute lg:-translate-y-1/2 lg:w-[42%]"
          style={{
            right: "-8px",
            top: "50%",
            background: "#ffffff",
            borderRadius: "18px",
            padding: "14px 16px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
            zIndex: 2,
          }}
        >
          {/* Header: logos + meta */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Image
              src="/google-gmail.svg"
              alt="Gmail"
              width={32}
              height={32}
              style={{ flexShrink: 0 }}
            />
            <div>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0f172a",
                  fontFamily: "var(--font-outfit)",
                  lineHeight: 1.2,
                }}
              >
                Email Drafted
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                Me, Matt Pearson
              </p>
            </div>
          </div>

          {/* Body preview */}
          <div
            style={{
              fontSize: "12px",
              color: "#1e293b",
              fontFamily: "var(--font-dm-sans)",
              lineHeight: 1.55,
            }}
          >
            <p>Hi Matt,</p>
            <p style={{ marginTop: "4px", color: "#64748b" }}>
              I wanted to follow up on a few things from our call. Pricing breakdown is coming today, security doc by Friday.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
