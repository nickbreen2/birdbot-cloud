"use client"

import Image from "next/image"

// Phone center in container coords (W=250, H=544, CT=6 → container 262×556)
const CX = 131
const CY = 278
const ORBIT_R = 165   // orbital radius in px
const SVG_BLEED = 130 // px SVG extends beyond container on each side

// Six logos evenly spaced at 60° intervals, different orbital periods so they
// drift into varied formations over time.
// animationDelay = -(startDeg / 360) * period  →  starts logo partway around orbit
const LOGOS = [
  { name: 'gmail',    src: '/google-gmail.svg',        period: 12, startDeg: 0   },
  { name: 'outlook',  src: '/Microsoft_Outlook.svg',   period: 14, startDeg: 60  },
  { name: 'calendar', src: '/google-calendar.svg',     period: 10, startDeg: 120 },
  { name: 'drive',    src: '/google-drive.svg',        period: 16, startDeg: 180 },
  { name: 'slack',    src: '/Slack.svg',               period: 11, startDeg: 240 },
  { name: 'telegram', src: '/Telegram.svg',            period: 13, startDeg: 300 },
] as const

export function OrbitalLogos() {
  return (
    <>
      {/* Orbit guide ring — desktop only */}
      <svg
        className="hidden md:block"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: -SVG_BLEED,
          top: 0,
          width: 262 + SVG_BLEED * 2,
          height: 556,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'visible',
        }}
        viewBox={`${-SVG_BLEED} 0 ${262 + SVG_BLEED * 2} 556`}
      >
        <circle
          cx={CX}
          cy={CY}
          r={ORBIT_R}
          fill="none"
          style={{ stroke: 'rgba(99, 102, 241, 0.12)', strokeWidth: 1, strokeDasharray: '2 8' }}
        />
      </svg>

      {/* Orbiting logos — desktop only.
          Each logo is a 0×0 pivot at the phone center; orbit-cw rotates it around
          the center, translates to orbital radius, then counter-rotates the logo
          to keep it upright. */}
      {LOGOS.map(logo => {
        const delay = -((logo.startDeg / 360) * logo.period)
        return (
          <div
            key={logo.name}
            className="hidden md:block"
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: CX,
              top: CY,
              width: 0,
              height: 0,
              zIndex: 5,
              '--orbit-r': `${ORBIT_R}px`,
              animation: `orbit-cw ${logo.period}s ${delay}s linear infinite`,
            } as React.CSSProperties}
          >
            {/* Logo circle — offset by half its size to center on the orbital position */}
            <div
              style={{
                position: 'absolute',
                left: -32,
                top: -32,
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              <Image src={logo.src} alt="" width={40} height={40} unoptimized />
            </div>
          </div>
        )
      })}
    </>
  )
}
