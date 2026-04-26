import Image from "next/image"

export function MeetingSchedulingVisual() {
  return (
    <div
      className="relative w-full lg:aspect-[4/3] overflow-hidden flex flex-col justify-center lg:block p-5 lg:p-12"
      style={{
        background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
        borderRadius: "24px",
      }}
    >
      {/* iMessage bubble — top right */}
      <div className="hidden lg:flex justify-end mb-3">
        <div
          style={{
            background: "#007AFF",
            borderRadius: "18px 18px 4px 18px",
            padding: "10px 14px",
            maxWidth: "80%",
            color: "#ffffff",
            fontSize: "15px",
            lineHeight: "1.4",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          Can you add my interview on Thursday at 10am to my calendar?
        </div>
      </div>

      {/* Google Calendar event card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "24px",
          padding: "20px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)",
        }}
      >
        {/* Calendar logo */}
        <div style={{ marginBottom: "16px" }}>
          <Image
            src="/google-calendar.svg"
            alt="Google Calendar"
            width={40}
            height={40}
          />
        </div>

        {/* "Added Thursday" heading */}
        <p
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#0f172a",
            marginBottom: "16px",
            fontFamily: "var(--font-outfit)",
          }}
        >
          Added to Thursday
        </p>

        {/* Event row */}
        <div
          style={{
            background: "#dbeafe",
            borderRadius: "12px",
            padding: "14px 16px",
          }}
        >
          <p
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#1e40af",
              marginBottom: "4px",
              fontFamily: "var(--font-outfit)",
            }}
          >
            Interview
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "#3b82f6",
              marginBottom: "10px",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            Thursday 10:00 – 11:00 AM
          </p>
          {/* Checkmark confirmation */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span
              style={{
                fontSize: "13px",
                color: "#3b82f6",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              Done! Reminder set for 9:45 AM
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
