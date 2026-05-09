"use client"
import { useEffect, useState } from 'react'
import Image from 'next/image'

const CONTAINER = 360
const INNER_RADIUS = 90
const OUTER_RADIUS = 152
const ICON_SIZE = 26
const INNER_SPEED = 0.38
const OUTER_SPEED = -0.24

const INNER_ICONS = [
  { id: 'telegram', src: '/Telegram.svg', alt: 'Telegram', phase: 0 },
  { id: 'whatsapp', src: '/Whatsapp.svg', alt: 'WhatsApp', phase: (2 * Math.PI) / 3 },
  { id: 'imessage', src: '/IMessage.svg', alt: 'iMessage', phase: (4 * Math.PI) / 3 },
]

const OUTER_ICONS = [
  { id: 'gmail',  src: '/google-gmail.svg',    alt: 'Gmail',           phase: 0 },
  { id: 'gcal',   src: '/google-calendar.svg', alt: 'Google Calendar', phase: (2 * Math.PI) / 3 },
  { id: 'gdrive', src: '/google-drive.svg',    alt: 'Google Drive',    phase: (4 * Math.PI) / 3 },
]

// Fixed star positions — no hydration mismatch
const STARS = [
  { x: 6,  y: 14, s: 1.5, o: 0.25 }, { x: 91, y: 8,  s: 1,   o: 0.18 },
  { x: 78, y: 88, s: 1.5, o: 0.22 }, { x: 14, y: 82, s: 1,   o: 0.15 },
  { x: 52, y: 4,  s: 1,   o: 0.20 }, { x: 96, y: 51, s: 1.5, o: 0.18 },
  { x: 3,  y: 48, s: 1,   o: 0.20 }, { x: 42, y: 95, s: 1,   o: 0.15 },
  { x: 86, y: 32, s: 1,   o: 0.12 }, { x: 22, y: 28, s: 1,   o: 0.14 },
  { x: 68, y: 72, s: 1.5, o: 0.16 }, { x: 33, y: 65, s: 1,   o: 0.12 },
]

export function OnboardingOrbitVisual() {
  const [time, setTime] = useState(0)

  useEffect(() => {
    let id: number
    let last = performance.now()
    const tick = (now: number) => {
      setTime(t => t + (now - last) / 1000)
      last = now
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div style={{ position: 'relative', width: CONTAINER, height: CONTAINER }}>

        {/* Star particles */}
        {STARS.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
            width: s.s, height: s.s, borderRadius: '50%',
            background: '#fff', opacity: s.o, pointerEvents: 'none',
          }} />
        ))}

        {/* Orbit rings — glowing solid */}
        {[
          { r: INNER_RADIUS, delay: '0s' },
          { r: OUTER_RADIUS, delay: '1.5s' },
        ].map(({ r, delay }) => (
          <div key={r} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: r * 2, height: r * 2,
            marginLeft: -r, marginTop: -r,
            borderRadius: '50%', pointerEvents: 'none',
          }}>
            {/* Glowing fill */}
            <div className="animate-pulse" style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: '50%',
              background: 'radial-gradient(circle, transparent 35%, rgba(37,99,235,0.07) 65%, rgba(37,99,235,0.13) 100%)',
              boxShadow: '0 0 40px rgba(37,99,235,0.12), inset 0 0 40px rgba(37,99,235,0.07)',
              animationDelay: delay,
            }} />
            {/* Solid ring border */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.14)',
            }} />
          </div>
        ))}

        {/* Center: BirdBot bird */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', zIndex: 10,
        }}>
          <Image src="/birdbot-animated (1).svg" alt="BirdBot" width={76} height={76} unoptimized />
        </div>

        {/* Inner orbit — messaging platforms */}
        {INNER_ICONS.map(icon => {
          const a = time * INNER_SPEED + icon.phase
          const x = Math.cos(a) * INNER_RADIUS
          const y = Math.sin(a) * INNER_RADIUS
          return (
            <div key={icon.id} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: ICON_SIZE, height: ICON_SIZE, zIndex: 5,
              transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
              filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.6))',
            }}>
              <img src={icon.src} alt={icon.alt} width={ICON_SIZE} height={ICON_SIZE} style={{ display: 'block' }} />
            </div>
          )
        })}

        {/* Outer orbit — Google integrations */}
        {OUTER_ICONS.map(icon => {
          const a = time * OUTER_SPEED + icon.phase
          const x = Math.cos(a) * OUTER_RADIUS
          const y = Math.sin(a) * OUTER_RADIUS
          return (
            <div key={icon.id} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: ICON_SIZE, height: ICON_SIZE, zIndex: 5,
              transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
              background: 'white',
              borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 3,
              boxShadow: '0 3px 10px rgba(0,0,0,0.5)',
            }}>
              <img src={icon.src} alt={icon.alt} width={ICON_SIZE - 6} height={ICON_SIZE - 6} style={{ display: 'block' }} />
            </div>
          )
        })}

    </div>
  )
}
