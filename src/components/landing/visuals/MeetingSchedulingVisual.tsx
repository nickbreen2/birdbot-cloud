import Image from "next/image"

export function MeetingSchedulingVisual() {
  return (
    <div
      className="relative w-full aspect-[4/3] overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
        borderRadius: "24px",
        padding: "48px",
      }}
    >
      {/* iMessage bubble — top right */}
      <div className="flex justify-end mb-3">
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
          Set up time with Matt this week
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
          Added Thursday
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
            Sync with Matt
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "#3b82f6",
              marginBottom: "10px",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            Thursday 2:30 – 3:30 PM
          </p>
          {/* Avatar + attendees */}
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
                fontSize: "10px",
                fontWeight: 700,
                color: "#ffffff",
                flexShrink: 0,
                fontFamily: "var(--font-outfit)",
              }}
            >
              MP
            </div>
            <span
              style={{
                fontSize: "13px",
                color: "#3b82f6",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              You + Matt
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
