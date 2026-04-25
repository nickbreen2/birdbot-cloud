"use client"

import Image from "next/image"

const ORBIT_R = 190    // px from phone center to logo center
const ORBIT_SIZE = (ORBIT_R + 32) * 2  // 444px — fits radius + logo half-width on each side

// Phone center within the 262×556 container: (131, 278)
// Container left = 131 - (ORBIT_R + 32) = -91
// Container top  = 278 - (ORBIT_R + 32) = 56

const LOGOS = [
  { name: 'gmail',    src: '/google-gmail.svg',       angle: 0   },
  { name: 'outlook',  src: '/Microsoft_Outlook.svg',  angle: 60  },
  { name: 'calendar', src: '/google-calendar.svg',    angle: 120 },
  { name: 'drive',    src: '/google-drive.svg',       angle: 180 },
  { name: 'slack',    src: '/Slack.svg',               angle: 240 },
  { name: 'telegram', src: '/Telegram.svg',            angle: 300 },
] as const

export function OrbitalLogos() {
  return (
    <div
      className="hidden md:block"
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: 131 - (ORBIT_R + 32),   // -91
        top: 278 - (ORBIT_R + 32),    //  56
        width: ORBIT_SIZE,
        height: ORBIT_SIZE,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      {/* Faint orbital ring */}
      <svg
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        width={ORBIT_SIZE}
        height={ORBIT_SIZE}
      >
        <circle
          cx={ORBIT_SIZE / 2}
          cy={ORBIT_SIZE / 2}
          r={ORBIT_R}
          fill="none"
          stroke="rgba(99, 102, 241, 0.08)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
      </svg>

      {/* Rotating orbit track */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          animation: 'orbit-cw 60s linear infinite',
        }}
      >
        {LOGOS.map(logo => (
          <div
            key={logo.name}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginLeft: -32,
              marginTop: -32,
              transform: `rotate(${logo.angle}deg) translateX(${ORBIT_R}px) rotate(-${logo.angle}deg)`,
            }}
          >
            {/* Counter-rotate so logo stays upright */}
            <div style={{ animation: 'orbit-ccw 60s linear infinite' }}>
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
          </div>
        ))}
      </div>
    </div>
  )
}
