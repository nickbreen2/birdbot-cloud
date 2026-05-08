import Image from "next/image"

export function MeetingSchedulingVisual() {
  return (
    <div
      className="relative w-full aspect-[3/4] sm:aspect-[4/3] md:aspect-square lg:aspect-[4/3] overflow-hidden flex flex-col justify-center gap-2.5 sm:gap-3.5 p-4 sm:p-10 md:p-5 lg:p-12"
      style={{
        background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
        borderRadius: "24px",
      }}
    >
      {/* User iMessage bubble — always visible */}
      <div className="flex justify-end">
        <div
          className="text-[12px] sm:text-[15px]"
          style={{
            background: "#007AFF",
            borderRadius: "18px 18px 4px 18px",
            padding: "8px 12px",
            maxWidth: "82%",
            color: "#ffffff",
            lineHeight: 1.4,
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
          borderRadius: "20px",
          padding: "14px 16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <Image src="/google-calendar.svg" alt="Google Calendar" width={30} height={30} />
        </div>

        <p
          className="text-[14px] sm:text-[18px]"
          style={{
            fontWeight: 600,
            color: "#0f172a",
            marginBottom: "12px",
            fontFamily: "var(--font-outfit)",
          }}
        >
          Added to Thursday
        </p>

        <div style={{ background: "#dbeafe", borderRadius: "10px", padding: "10px 12px" }}>
          <p
            className="text-[13px] sm:text-[15px]"
            style={{ fontWeight: 600, color: "#1e40af", marginBottom: "3px", fontFamily: "var(--font-outfit)" }}
          >
            Interview
          </p>
          <p
            className="text-[11px] sm:text-[13px]"
            style={{ color: "#3b82f6", marginBottom: "7px", fontFamily: "var(--font-dm-sans)" }}
          >
            Thursday 10:00 – 11:00 AM
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span
              className="text-[11px] sm:text-[13px]"
              style={{ color: "#3b82f6", fontFamily: "var(--font-dm-sans)" }}
            >
              Done! Reminder set for 9:45 AM
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
