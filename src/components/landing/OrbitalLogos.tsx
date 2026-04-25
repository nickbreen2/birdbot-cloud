"use client"

import Image from "next/image"

// Coordinate system matches PhoneMockup outer container (W=250, H=544, CT=6):
//   container: 262 × 556  (phone screen + 2 × case thickness)
//   origin: top-left of the titanium case
//   phone center: (131, 278)
// Logos: 64×64px circles. Coordinates are top-left of each circle.
const SVG_BLEED = 130  // px SVG extends beyond container on each side

const LOGOS = [
  {
    name: 'gmail',
    src: '/google-gmail.svg',
    x: -91, y: 45,
    linePath: 'M -59 77 Q 36 140 131 278',
    driftDuration: 5.0, driftDelay: 0.0,
  },
  {
    name: 'outlook',
    src: '/Microsoft_Outlook.svg',
    x: 289, y: 45,
    linePath: 'M 321 77 Q 226 140 131 278',
    driftDuration: 5.5, driftDelay: 0.9,
  },
  {
    name: 'calendar',
    src: '/google-calendar.svg',
    x: -111, y: 246,
    linePath: 'M -79 278 Q 26 258 131 278',
    driftDuration: 4.8, driftDelay: 0.5,
  },
  {
    name: 'drive',
    src: '/google-drive.svg',
    x: 309, y: 246,
    linePath: 'M 341 278 Q 236 258 131 278',
    driftDuration: 5.2, driftDelay: 1.3,
  },
  {
    name: 'slack',
    src: '/Slack.svg',
    x: -91, y: 447,
    linePath: 'M -59 479 Q 36 415 131 278',
    driftDuration: 5.8, driftDelay: 0.2,
  },
  {
    name: 'telegram',
    src: '/Telegram.svg',
    x: 289, y: 447,
    linePath: 'M 321 479 Q 226 415 131 278',
    driftDuration: 4.5, driftDelay: 0.7,
  },
] as const

export function OrbitalLogos() {
  return (
    <>
      {/* SVG connection lines — desktop only */}
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
        {LOGOS.map(logo => (
          <path
            key={logo.name}
            d={logo.linePath}
            fill="none"
            style={{
              stroke: 'rgba(99, 102, 241, 0.15)',
              strokeWidth: 1,
              strokeDasharray: '4 6',
            }}
          />
        ))}
      </svg>

      {/* Logo circles — desktop only */}
      {LOGOS.map(logo => (
        <div
          key={logo.name}
          className="hidden md:block"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: logo.x,
            top: logo.y,
            zIndex: 5,
            animation: `logo-drift ${logo.driftDuration}s ${logo.driftDelay}s ease-in-out infinite`,
          }}
        >
          <div
            style={{
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
      ))}
    </>
  )
}
