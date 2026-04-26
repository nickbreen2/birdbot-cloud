const ICONS = [
  { id: "gmail",    src: "/google-gmail.svg",     alt: "Gmail"            },
  { id: "calendar", src: "/google-calendar.svg",  alt: "Google Calendar"  },
  { id: "drive",    src: "/google-drive.svg",     alt: "Google Drive"     },
  { id: "outlook",  src: "/Microsoft_Outlook.svg", alt: "Outlook"         },
  { id: "slack",    src: "/Slack.svg",             alt: "Slack"           },
  { id: "discord",  src: "/Discord.svg",           alt: "Discord"         },
]

export function IntegrateVisual() {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 50% 50%, rgba(37,99,235,0.08) 0%, transparent 70%)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 68px)",
          gridTemplateRows: "repeat(2, 68px)",
          gap: 14,
        }}
      >
        {ICONS.map((icon) => (
          <div
            key={icon.id}
            style={{
              width: 68,
              height: 68,
              borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 14,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={icon.src}
              alt={icon.alt}
              width={40}
              height={40}
              style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
