"use client"

import BirdbotIMessage from "@/components/birdbot/BirdbotIMessage"

// ── Phone dimensions ───────────────────────────────────────────────────────────
// Full device: 402 + 10px case on each side = 422 × 894
const DEVICE_W = 422
const DEVICE_H = 894
const SCALE = 0.72
const SCALED_W = Math.round(DEVICE_W * SCALE) // 304
const SCALED_H = Math.round(DEVICE_H * SCALE) // 644

// ── Sky scene ─────────────────────────────────────────────────────────────────
const CONTAINER_H = 720

// cloud-drift keyframe: translateX(1100px) → translateX(-300px) = 1400px travel
// delay formula: -(1100 - desiredVisualX) / 1400 * duration
// left: 0 for all; transform positions them at desiredVisualX at t=0
const CLOUDS = [
  // left side
  { size: 220, top: 65,  opacity: 0.9,  dur: 160, delay: -122 }, // visual x ≈ 30
  { size: 155, top: 215, opacity: 0.85, dur: 190, delay: -138 }, // visual x ≈ 80
  { size: 260, top: 360, opacity: 0.9,  dur: 145, delay: -116 }, // visual x ≈ -20 (partial)
  // right side
  { size: 140, top: 48,  opacity: 0.8,  dur: 210, delay: -72  }, // visual x ≈ 620
  { size: 170, top: 180, opacity: 0.87, dur: 175, delay: -55  }, // visual x ≈ 660
  { size: 200, top: 325, opacity: 0.88, dur: 152, delay: -39  }, // visual x ≈ 740
  // small upper-center
  { size: 110, top: 18,  opacity: 0.75, dur: 220, delay: -112 }, // visual x ≈ 390
] as const

function Cloud({ size, opacity }: { size: number; opacity: number }) {
  const h = Math.round(size * 0.42)
  const bg = `rgba(255,255,255,${opacity})`
  return (
    <div style={{ position: 'relative', width: size, height: h }}>
      {/* base body */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: Math.round(h * 0.58), background: bg, borderRadius: h }} />
      {/* left puff */}
      <div style={{ position: 'absolute', bottom: Math.round(h * 0.30), left: Math.round(size * 0.08), width: Math.round(size * 0.36), height: Math.round(h * 0.70), background: bg, borderRadius: '50%' }} />
      {/* center puff (tallest) */}
      <div style={{ position: 'absolute', bottom: Math.round(h * 0.36), left: Math.round(size * 0.35), width: Math.round(size * 0.32), height: Math.round(h * 0.92), background: bg, borderRadius: '50%' }} />
      {/* right puff */}
      <div style={{ position: 'absolute', bottom: Math.round(h * 0.25), left: Math.round(size * 0.60), width: Math.round(size * 0.28), height: Math.round(h * 0.62), background: bg, borderRadius: '50%' }} />
    </div>
  )
}

export function ConversationDemo() {
  const phoneTop = Math.round((CONTAINER_H - SCALED_H) / 2) // 38px
  const phoneLeft = `calc(50% - ${Math.round(SCALED_W / 2)}px)`

  return (
    <section className="py-20 px-4 overflow-hidden" id="demo">
      {/* Sky scene card */}
      <div
        className="relative mx-auto overflow-hidden"
        style={{
          maxWidth: 880,
          height: CONTAINER_H,
          borderRadius: 28,
          background: 'linear-gradient(180deg, #4A8EC8 0%, #6AACE0 28%, #87CEEB 58%, #B8D9F0 100%)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.3)',
        }}
      >
        {/* Sun bloom */}
        <div
          aria-hidden
          style={{
            position: 'absolute', top: -70, left: '12%',
            width: 340, height: 340, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,248,210,0.38) 0%, transparent 65%)',
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
              top: c.top,
              left: 0,
              zIndex: 1,
              pointerEvents: 'none',
              animation: `cloud-drift ${c.dur}s ${c.delay}s linear infinite`,
            }}
          >
            <Cloud size={c.size} opacity={c.opacity} />
          </div>
        ))}

        {/* Phone — in front of clouds */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: phoneLeft,
            top: phoneTop,
            width: SCALED_W,
            height: SCALED_H,
            overflow: 'visible',
            zIndex: 2,
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
            <BirdbotIMessage />
          </div>
        </div>

        {/* Bottom haze */}
        <div
          aria-hidden
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 64,
            background: 'linear-gradient(to bottom, transparent, rgba(180,215,240,0.45))',
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
