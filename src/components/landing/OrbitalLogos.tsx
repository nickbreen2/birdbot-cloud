"use client"

import Image from "next/image"

export type ActiveIntegration = 'gmail' | 'calendar' | null

interface OrbitalLogosProps {
  activeIntegration: ActiveIntegration
}

// Coordinate system matches PhoneMockup outer container (W=310, H=674, CT=8):
//   container: 326 × 690  (phone screen + 2 × case thickness)
//   origin: top-left of the titanium case
//   phone center: (163, 345)
// Logos: 64×64px circles. Coordinates are top-left of each circle.
const SVG_BLEED = 130  // px SVG extends beyond container on each side

const LOGOS = [
  {
    name: 'gmail' as const,
    src: '/google-gmail.svg',
    x: -89, y: 63,
    linePath: 'M -57 95 Q 53 180 163 345',
    driftDuration: 5.0, driftDelay: 0.0,
  },
  {
    name: 'outlook' as const,
    src: '/Microsoft_Outlook.svg',
    x: 351, y: 63,
    linePath: 'M 383 95 Q 273 180 163 345',
    driftDuration: 5.5, driftDelay: 0.9,
  },
  {
    name: 'calendar' as const,
    src: '/google-calendar.svg',
    x: -109, y: 313,
    linePath: 'M -77 345 Q 43 320 163 345',
    driftDuration: 4.8, driftDelay: 0.5,
  },
  {
    name: 'drive' as const,
    src: '/google-drive.svg',
    x: 371, y: 313,
    linePath: 'M 403 345 Q 283 320 163 345',
    driftDuration: 5.2, driftDelay: 1.3,
  },
  {
    name: 'slack' as const,
    src: '/Slack.svg',
    x: -89, y: 563,
    linePath: 'M -57 595 Q 53 510 163 345',
    driftDuration: 5.8, driftDelay: 0.2,
  },
  {
    name: 'telegram' as const,
    src: '/Telegram.svg',
    x: 351, y: 563,
    linePath: 'M 383 595 Q 273 510 163 345',
    driftDuration: 4.5, driftDelay: 0.7,
  },
] as const

export function OrbitalLogos({ activeIntegration }: OrbitalLogosProps) {
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
          width: 326 + SVG_BLEED * 2,
          height: 690,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'visible',
        }}
        viewBox={`${-SVG_BLEED} 0 ${326 + SVG_BLEED * 2} 690`}
      >
        {LOGOS.map(logo => (
          <path
            key={logo.name}
            d={logo.linePath}
            fill="none"
            style={{
              stroke: activeIntegration === logo.name
                ? 'rgba(99, 102, 241, 0.6)'
                : 'rgba(99, 102, 241, 0.15)',
              strokeWidth: 1,
              strokeDasharray: '4 6',
              transition: 'stroke 0.3s ease',
            }}
          />
        ))}
      </svg>

      {/* Logo circles — desktop only */}
      {LOGOS.map(logo => {
        const isActive = activeIntegration === logo.name
        return (
          <div
            key={logo.name}
            className="hidden md:block"
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: logo.x,
              top: logo.y,
              zIndex: 5,
              // Outer div owns the vertical drift — keeps the transform separate from inner scale
              animation: `logo-drift ${logo.driftDuration}s ${logo.driftDelay}s ease-in-out infinite`,
            }}
          >
            {/* Inner div owns scale + glow on active */}
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
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                boxShadow: isActive
                  ? '0 0 24px rgba(99, 102, 241, 0.4)'
                  : '0 4px 12px rgba(0, 0, 0, 0.3)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              <Image
                src={logo.src}
                alt=""
                width={40}
                height={40}
                unoptimized
              />
            </div>
          </div>
        )
      })}
    </>
  )
}
