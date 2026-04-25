import type { ActiveLogo } from "@/components/birdbot/BirdbotIMessage"

const LOGOS: Record<
  NonNullable<ActiveLogo>["logo"],
  { src: string; alt: string }
> = {
  gmail:    { src: "/google-gmail.svg",    alt: "Gmail" },
  drive:    { src: "/google-drive.svg",    alt: "Google Drive" },
  calendar: { src: "/google-calendar.svg", alt: "Google Calendar" },
}

// Phone is at calc(50% - 152px) left, 304px wide.
// Left callout: right edge 60px from phone left → right: calc(50% + 212px)
// Right callout: left edge 60px from phone right → left: calc(50% + 212px)
const SIDE_STYLE: Record<NonNullable<ActiveLogo>["side"], React.CSSProperties> = {
  left:  { right: "calc(50% + 212px)" },
  right: { left:  "calc(50% + 212px)" },
}

export function IntegrationCallouts({ activeLogo }: { activeLogo: ActiveLogo }) {
  if (!activeLogo) return null

  const { src, alt } = LOGOS[activeLogo.logo]

  return (
    <div
      className="hidden md:block"
      style={{
        position: "absolute",
        top: 250,
        ...SIDE_STYLE[activeLogo.side],
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      <div
        className="callout-pop"
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} width={40} height={40} />
      </div>
    </div>
  )
}
