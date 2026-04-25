"use client"

import { useState } from "react"
import BirdbotIMessage, { type ActiveLogo } from "@/components/birdbot/BirdbotIMessage"
import { IntegrationCallouts } from "@/components/landing/IntegrationCallouts"

// ── Phone dimensions ───────────────────────────────────────────────────────────
// Full device: 402 + 10px case on each side = 422 × 894
const DEVICE_W = 422
const DEVICE_H = 894
const SCALE = 0.72
const SCALED_W = Math.round(DEVICE_W * SCALE) // 304
const SCALED_H = Math.round(DEVICE_H * SCALE) // 644

// ── Sky scene ─────────────────────────────────────────────────────────────────
const CONTAINER_H = 720

// cloud-drift keyframe: translateX(-300px) → translateX(1180px) = 1480px travel
// at t=0 visual x = -300 + (|delay| / dur) * 1480
const CLOUDS = [
  { yPct: 8,  scale: 0.90, opacity: 0.95, dur: 200, delay: 0    },
  { yPct: 22, scale: 0.55, opacity: 0.50, dur: 260, delay: -80  },
  { yPct: 38, scale: 0.75, opacity: 0.85, dur: 220, delay: -40  },
  { yPct: 52, scale: 0.45, opacity: 0.45, dur: 300, delay: -160 },
  { yPct: 68, scale: 0.85, opacity: 0.90, dur: 240, delay: -120 },
  { yPct: 14, scale: 0.50, opacity: 0.50, dur: 280, delay: -200 },
  { yPct: 32, scale: 0.70, opacity: 0.75, dur: 230, delay: -150 },
  { yPct: 80, scale: 0.60, opacity: 0.70, dur: 250, delay: -90  },
] as const

function Cloud({ scale, opacity, index }: { scale: number; opacity: number; index: number }) {
  const w = Math.round(260 * scale)
  const h = Math.round(120 * scale)
  const gid = `cloud-g-${index}`
  const fid = `cloud-f-${index}`
  return (
    <svg width={w} height={h} viewBox="0 0 260 120" style={{ display: 'block', opacity }}>
      <defs>
        <radialGradient id={gid} cx="50%" cy="55%" r="60%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="1" />
          <stop offset="60%"  stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#E8F1FB" stopOpacity="0" />
        </radialGradient>
        <filter id={fid} x="-20%" y="-30%" width="140%" height="160%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <g filter={`url(#${fid})`} fill={`url(#${gid})`}>
        <ellipse cx="70"  cy="78" rx="60" ry="28" />
        <ellipse cx="120" cy="62" rx="50" ry="34" />
        <ellipse cx="170" cy="70" rx="55" ry="30" />
        <ellipse cx="200" cy="82" rx="45" ry="22" />
        <ellipse cx="100" cy="84" rx="50" ry="20" />
        <ellipse cx="145" cy="78" rx="55" ry="26" />
      </g>
    </svg>
  )
}

export function ConversationDemo() {
  const phoneTop = Math.round((CONTAINER_H - SCALED_H) / 2) // 38px
  const phoneLeft = `calc(50% - ${Math.round(SCALED_W / 2)}px)`
  const [activeLogo, setActiveLogo] = useState<ActiveLogo>(null)

  return (
    <section className="py-20 px-4 overflow-hidden" id="demo">
      {/* Sky scene card */}
      <div
        className="relative mx-auto overflow-hidden h-[440px] md:h-[720px]"
        style={{
          maxWidth: 880,
          borderRadius: 28,
          background: 'linear-gradient(180deg, #4A9FE8 0%, #6FB4EE 30%, #9CCDF4 65%, #C8E2F8 100%)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.3)',
        }}
      >
        {/* Sun bloom — upper-left */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '-10%',
            top: '-25%',
            width: '50%',
            aspectRatio: '1',
            maxWidth: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,250,230,0.45) 0%, rgba(255,250,230,0) 60%)',
            filter: 'blur(20px)',
            pointerEvents: 'none',
          }}
        />

        {/* Animated clouds — behind the phone */}
        {CLOUDS.map((c, i) => (
          <div
            key={i}
            aria-hidden
            style={{
              position: 'absolute',
              top: `${c.yPct}%`,
              left: 0,
              zIndex: 1,
              pointerEvents: 'none',
              animation: `cloud-drift ${c.dur}s ${c.delay}s linear infinite`,
            }}
          >
            <Cloud scale={c.scale} opacity={c.opacity} index={i} />
          </div>
        ))}

        {/* Integration callouts — contextual logo pop-ins */}
        <IntegrationCallouts key={activeLogo?.triggerId} activeLogo={activeLogo} />

        {/* Phone — in front of clouds */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: phoneLeft,
            top: phoneTop,
            width: SCALED_W,
            height: SCALED_H,
            clipPath: 'inset(0px -200px -200px -200px)',
            zIndex: 4,
          }}
        >
          <div
            style={{
              width: DEVICE_W,
              height: DEVICE_H,
              transform: `scale(${SCALE})`,
              transformOrigin: 'top left',
            }}
          >
            <BirdbotIMessage onLogoTrigger={setActiveLogo} />
          </div>
        </div>

        {/* Bottom haze */}
        <div
          aria-hidden
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
            background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 100%)',
            pointerEvents: 'none', zIndex: 3,
          }}
        />
      </div>

      {/* Screen reader transcript */}
      <div className="sr-only">
        <p>Conversation between you and Birdbot:</p>
        <p>Birdbot: morning! you&#39;ve got 16 unread emails and a meeting with Sarah at 2pm</p>
        <p>Birdbot: want me to draft replies and send you a prep doc?</p>
        <p>You: yes + find the q3 notes we talked about</p>
        <p>Birdbot: ✓ 3 drafts ready in Gmail</p>
        <p>Birdbot: ✓ prep doc saved to your calendar invite</p>
        <p>Birdbot: q3 notes — you asked me to remember &quot;pricing lands at $29&quot; last Tuesday</p>
      </div>
    </section>
  )
}
