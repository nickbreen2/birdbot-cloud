import Image from "next/image"

// Phone occupies: left=200, top=20, width=340, height=660 in the 740×700 container
// Each logo: 64×64px circle. Positions below are top-left corners.
const LOGOS = [
  {
    name: "Gmail",
    src: "/google-gmail.svg",
    left: 552,
    top: 40,
    delay: "0s",
    // Bezier: start on phone top-right area → control → logo center (584, 72)
    path: "M 505 105 Q 562 28 584 72",
  },
  {
    name: "Google Calendar",
    src: "/google-calendar.svg",
    left: 606,
    top: 278,
    delay: "0.6s",
    // Bezier: start on phone right edge → control → logo center (638, 310)
    path: "M 540 310 Q 598 282 638 310",
  },
  {
    name: "Google Drive",
    src: "/google-drive.svg",
    left: 548,
    top: 546,
    delay: "1.2s",
    // Bezier: start on phone bottom-right area → control → logo center (580, 578)
    path: "M 507 622 Q 558 648 580 578",
  },
  {
    name: "Slack",
    src: "/Slack.svg",
    left: 128,
    top: 546,
    delay: "1.8s",
    // Bezier: start on phone bottom-left area → control → logo center (160, 578)
    path: "M 233 622 Q 182 648 160 578",
  },
  {
    name: "Microsoft Outlook",
    src: "/Microsoft_Outlook.svg",
    left: 70,
    top: 278,
    delay: "2.4s",
    // Bezier: start on phone left edge → control → logo center (102, 310)
    path: "M 200 310 Q 142 282 102 310",
  },
  {
    name: "Telegram",
    src: "/Telegram.svg",
    left: 124,
    top: 40,
    delay: "3.0s",
    // Bezier: start on phone top-left area → control → logo center (156, 72)
    path: "M 235 105 Q 178 28 156 72",
  },
] as const

export function OrbitalLogos() {
  return (
    <>
      {/* SVG connector lines */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width="740"
        height="700"
        viewBox="0 0 740 700"
        fill="none"
        aria-hidden
      >
        {LOGOS.map((logo) => (
          <path
            key={logo.name}
            d={logo.path}
            stroke="rgba(37,99,235,0.22)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            strokeLinecap="round"
          />
        ))}
      </svg>

      {/* Logo circles */}
      {LOGOS.map((logo) => (
        <div
          key={logo.name}
          className="absolute"
          style={{
            left: logo.left,
            top: logo.top,
            width: 64,
            height: 64,
            animation: `float 3.6s ease-in-out infinite`,
            animationDelay: logo.delay,
          }}
        >
          {/* Glow behind circle */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)",
              filter: "blur(8px)",
              transform: "scale(1.4)",
            }}
          />
          {/* Logo container */}
          <div
            className="relative w-full h-full rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.96)",
              boxShadow:
                "0 4px 16px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
          >
            <Image
              src={logo.src}
              alt={logo.name}
              width={36}
              height={36}
              unoptimized
            />
          </div>
        </div>
      ))}
    </>
  )
}

// Compact 2×3 grid for mobile — rendered separately from the orbital layout
export function LogoRow() {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {LOGOS.map((logo) => (
        <div
          key={logo.name}
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(255,255,255,0.96)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)",
          }}
        >
          <Image
            src={logo.src}
            alt={logo.name}
            width={32}
            height={32}
            unoptimized
          />
        </div>
      ))}
    </div>
  )
}
