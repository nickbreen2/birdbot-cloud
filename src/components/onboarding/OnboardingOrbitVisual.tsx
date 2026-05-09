"use client"
import { useEffect, useState } from 'react'
import Image from 'next/image'

const CONTAINER = 360
const INNER_RADIUS = 90
const OUTER_RADIUS = 152
const ICON_SIZE = 26
const INNER_SPEED = 0.38
const OUTER_SPEED = -0.24

const YELLOW = 'rgba(251,191,36,'

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

const STARS = [
  { x: 6,  y: 14, s: 1.5, o: 0.25 }, { x: 91, y: 8,  s: 1,   o: 0.18 },
  { x: 78, y: 88, s: 1.5, o: 0.22 }, { x: 14, y: 82, s: 1,   o: 0.15 },
  { x: 52, y: 4,  s: 1,   o: 0.20 }, { x: 96, y: 51, s: 1.5, o: 0.18 },
  { x: 3,  y: 48, s: 1,   o: 0.20 }, { x: 42, y: 95, s: 1,   o: 0.15 },
  { x: 86, y: 32, s: 1,   o: 0.12 }, { x: 22, y: 28, s: 1,   o: 0.14 },
  { x: 68, y: 72, s: 1.5, o: 0.16 }, { x: 33, y: 65, s: 1,   o: 0.12 },
]

export function OnboardingOrbitVisual({ step = 1 }: { step?: number }) {
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

  // step 1: inner = active (yellow), outer = dim + frozen
  // step 2: outer = active (yellow), inner = dim + frozen
  const innerActive = step !== 2
  const outerActive = step === 2

  const activeRingBorder = `${YELLOW}0.45)`
  const dimRingBorder = 'rgba(255,255,255,0.07)'

  const activeRingFill = `radial-gradient(circle, transparent 35%, ${YELLOW}0.06) 65%, ${YELLOW}0.11) 100%)`
  const dimRingFill = 'radial-gradient(circle, transparent 35%, rgba(37,99,235,0.04) 65%, rgba(37,99,235,0.08) 100%)'

  const activeIconShadow = `drop-shadow(0 0 10px ${YELLOW}0.8)) drop-shadow(0 3px 10px rgba(0,0,0,0.6))`
  const dimIconFilter = 'grayscale(1) brightness(0.5)'

  return (
    <div style={{ position: 'relative', width: CONTAINER, height: CONTAINER }}>

      {STARS.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          width: s.s, height: s.s, borderRadius: '50%',
          background: '#fff', opacity: s.o, pointerEvents: 'none',
        }} />
      ))}

      {/* Orbit rings */}
      {[
        { r: INNER_RADIUS, active: innerActive, delay: '0s' },
        { r: OUTER_RADIUS, active: outerActive, delay: '1.5s' },
      ].map(({ r, active, delay }) => (
        <div key={r} style={{
          position: 'absolute', top: '50%', left: '50%',
          width: r * 2, height: r * 2,
          marginLeft: -r, marginTop: -r,
          borderRadius: '50%', pointerEvents: 'none',
          transition: 'opacity 0.4s',
        }}>
          <div className="animate-pulse" style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: '50%',
            background: active ? activeRingFill : dimRingFill,
            boxShadow: active
              ? `0 0 40px ${YELLOW}0.18), inset 0 0 40px ${YELLOW}0.08)`
              : '0 0 20px rgba(37,99,235,0.06), inset 0 0 20px rgba(37,99,235,0.03)',
            animationDelay: delay,
          }} />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: '50%',
            border: `1px solid ${active ? activeRingBorder : dimRingBorder}`,
            transition: 'border-color 0.4s',
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
        const a = innerActive
          ? time * INNER_SPEED + icon.phase
          : icon.phase
        const x = Math.cos(a) * INNER_RADIUS
        const y = Math.sin(a) * INNER_RADIUS
        return (
          <div key={icon.id} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: ICON_SIZE, height: ICON_SIZE, zIndex: 5,
            transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
            filter: innerActive ? activeIconShadow : dimIconFilter,
            opacity: innerActive ? 1 : 0.35,
            transition: 'opacity 0.4s, filter 0.4s',
          }}>
            <img src={icon.src} alt={icon.alt} width={ICON_SIZE} height={ICON_SIZE} style={{ display: 'block' }} />
          </div>
        )
      })}

      {/* Outer orbit — Google integrations */}
      {OUTER_ICONS.map(icon => {
        const a = outerActive
          ? time * OUTER_SPEED + icon.phase
          : icon.phase
        const x = Math.cos(a) * OUTER_RADIUS
        const y = Math.sin(a) * OUTER_RADIUS
        return (
          <div key={icon.id} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: ICON_SIZE, height: ICON_SIZE, zIndex: 5,
            transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
            background: outerActive ? 'white' : 'rgba(255,255,255,0.3)',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 3,
            boxShadow: outerActive
              ? `0 0 14px ${YELLOW}0.7), 0 3px 10px rgba(0,0,0,0.5)`
              : '0 3px 8px rgba(0,0,0,0.3)',
            filter: outerActive ? undefined : dimIconFilter,
            opacity: outerActive ? 1 : 0.35,
            transition: 'opacity 0.4s, box-shadow 0.4s, filter 0.4s',
          }}>
            <img src={icon.src} alt={icon.alt} width={ICON_SIZE - 6} height={ICON_SIZE - 6} style={{ display: 'block' }} />
          </div>
        )
      })}

    </div>
  )
}
