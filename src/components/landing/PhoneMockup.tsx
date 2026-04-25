"use client"

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { OrbitalLogos, type ActiveIntegration } from "./OrbitalLogos"

const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro", system-ui, sans-serif'
const BUBBLE_GRAY = '#E9E9EB'
const TEXT_SEC = 'rgba(60,60,67,0.6)'

// Scale: reference design is 402×874px; we render at 310px wide
const W = 310
const H = Math.round(W * 874 / 402)  // 674
const S = W / 402
const p = (n: number) => Math.round(n * S)

const CT      = p(10)                  // titanium case thickness
const HOME_H  = p(22)                  // home spacer height
const BAR_H   = p(7) + p(33) + p(10)  // input bar height
const COVER_H = HOME_H + BAR_H        // total opaque cover at bottom

// ── Script ────────────────────────────────────────────────────

type ScriptStep =
  | { kind: 'typing'; from: 'them'; delay: number; dur: number }
  | { kind: 'msg'; from: 'me' | 'them'; text: string }
  | { kind: 'compose'; delay: number; text: string; dur: number }
  | { kind: 'read'; delay: number }
  | { kind: 'restart'; delay: number }

const SCRIPT: ScriptStep[] = [
  { kind: 'typing', from: 'them', delay: 600, dur: 1500 },
  { kind: 'msg', from: 'them', text: "morning! you've got 16 unread emails and a meeting with Sarah at 2pm" },
  { kind: 'typing', from: 'them', delay: 700, dur: 1400 },
  { kind: 'msg', from: 'them', text: 'want me to draft replies and send you a prep doc?' },
  { kind: 'compose', delay: 1200, text: 'yes + find the q3 notes we talked about', dur: 1600 },
  { kind: 'msg', from: 'me', text: 'yes + find the q3 notes we talked about' },
  { kind: 'read', delay: 600 },
  { kind: 'typing', from: 'them', delay: 1100, dur: 1700 },
  { kind: 'msg', from: 'them', text: '✓ 3 drafts ready in Gmail' },
  { kind: 'typing', from: 'them', delay: 600, dur: 1300 },
  { kind: 'msg', from: 'them', text: '✓ prep doc saved to your calendar invite' },
  { kind: 'typing', from: 'them', delay: 700, dur: 1900 },
  { kind: 'msg', from: 'them', text: 'q3 notes — you asked me to remember "pricing lands at $29" last Tuesday' },
  { kind: 'restart', delay: 5000 },
]

// ── Chat state ────────────────────────────────────────────────

type ChatItem = {
  id: string
  kind: 'msg' | 'typing'
  from: 'me' | 'them'
  text?: string
}

type RichItem = ChatItem & { tail: boolean; grouped: boolean }

// ── Timeline hook ─────────────────────────────────────────────

function useTimeline() {
  const [chat, setChat] = useState<ChatItem[]>([])
  const [composing, setComposing] = useState('')
  const [showRead, setShowRead] = useState(false)
  const [activeIntegration, setActiveIntegration] = useState<ActiveIntegration>(null)
  const idRef = useRef(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const runRef = useRef<() => void>(() => {})

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const after = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)) }

  const run = useCallback(() => {
    clearTimers()
    setChat([]); setComposing(''); setShowRead(false); setActiveIntegration(null)

    let t = 400
    for (let i = 0; i < SCRIPT.length; i++) {
      const step = SCRIPT[i]

      if (step.kind === 'typing') {
        t += step.delay
        const tid = `t${i}`
        after(() => setChat(c => [...c, { id: tid, kind: 'typing', from: 'them' }]), t)
        t += step.dur
        after(() => setChat(c => c.filter(x => x.id !== tid)), t)
      } else if (step.kind === 'msg') {
        t += 50
        const id = `m${++idRef.current}`
        const { from, text } = step
        after(() => {
          setChat(c => [...c, { id, kind: 'msg', from, text }])
          if (from === 'me') setShowRead(false)
          const lower = text.toLowerCase()
          if (lower.includes('gmail')) {
            setActiveIntegration('gmail')
            timers.current.push(setTimeout(() => setActiveIntegration(null), 1500))
          } else if (lower.includes('calendar')) {
            setActiveIntegration('calendar')
            timers.current.push(setTimeout(() => setActiveIntegration(null), 1500))
          }
        }, t)
      } else if (step.kind === 'compose') {
        t += step.delay
        const { text, dur } = step
        const pc = dur / text.length
        for (let k = 1; k <= text.length; k++)
          after(() => setComposing(text.slice(0, k)), t + k * pc)
        t += dur
        after(() => setComposing(''), t + 30)
      } else if (step.kind === 'read') {
        t += step.delay
        after(() => setShowRead(true), t)
      } else if (step.kind === 'restart') {
        t += step.delay
        after(() => runRef.current(), t)
      }
    }
  }, [])

  useEffect(() => { runRef.current = run })
  useEffect(() => { run(); return clearTimers }, [run])

  return { chat, composing, showRead, activeIntegration }
}

// ── Status bar ────────────────────────────────────────────────

function StatusBar() {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
      display: 'flex', gap: p(154), alignItems: 'center', justifyContent: 'center',
      padding: `${p(21)}px ${p(24)}px ${p(19)}px`,
      boxSizing: 'border-box',
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: SF, fontWeight: 590, fontSize: p(17), color: '#000', lineHeight: 1 }}>9:41</span>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: p(7) }}>
        <svg width={p(19)} height={p(12)} viewBox="0 0 19 12">
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill="#000"/>
          <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill="#000"/>
          <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill="#000"/>
          <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill="#000"/>
        </svg>
        <svg width={p(17)} height={p(12)} viewBox="0 0 17 12">
          <path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z" fill="#000"/>
          <path d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z" fill="#000"/>
          <circle cx="8.5" cy="10.5" r="1.5" fill="#000"/>
        </svg>
        <svg width={p(27)} height={p(13)} viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="#000" strokeOpacity="0.35" fill="none"/>
          <rect x="2" y="2" width="20" height="9" rx="2" fill="#000"/>
          <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill="#000" fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  )
}

// ── Messages header ───────────────────────────────────────────

function MessagesHeader() {
  return (
    <div style={{
      padding: `${p(56)}px ${p(14)}px ${p(10)}px`,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      borderBottom: '0.5px solid rgba(60,60,67,0.18)',
      background: 'rgba(248,248,248,0.92)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      flexShrink: 0,
      position: 'relative', zIndex: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: p(2), width: p(60), paddingBottom: p(12) }}>
        <svg width={p(13)} height={p(22)} viewBox="0 0 13 22" fill="none">
          <path d="M11 2L2 11l9 9" stroke="#007AFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ color: '#007AFF', fontFamily: SF, fontSize: p(17), letterSpacing: -0.4, marginLeft: p(2) }}>4</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: p(3) }}>
        <div style={{
          width: p(50), height: p(50), borderRadius: '50%',
          background: '#F2F2F7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: p(30), lineHeight: 1,
          boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.06)',
        }}>🐦</div>
        <div style={{ fontFamily: SF, fontSize: p(11), color: '#000', letterSpacing: -0.1 }}>
          Birdbot
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: p(60), paddingBottom: p(12), paddingRight: p(6) }}>
        <svg width={p(22)} height={p(22)} viewBox="0 0 22 22" fill="none">
          <path d="M19.5 15.5l-3.2-1.4a1.4 1.4 0 00-1.6.3l-1 1c-2.6-1.3-4.7-3.4-6-6l1-1a1.4 1.4 0 00.3-1.6L7.6 3.6a1.4 1.4 0 00-1.6-.8l-2.9.7A1.4 1.4 0 002 4.9c.4 8.6 7.5 15.6 16 16a1.4 1.4 0 001.4-1.1l.7-2.9a1.4 1.4 0 00-.7-1.5z" fill="#007AFF"/>
        </svg>
      </div>
    </div>
  )
}

// ── Bubble ────────────────────────────────────────────────────

interface BubbleProps {
  text: string
  sent: boolean
  tail: boolean
  grouped: boolean
}

function Bubble({ text, sent, tail, grouped }: BubbleProps) {
  const fill = sent ? '#007AFF' : BUBBLE_GRAY
  const color = sent ? '#fff' : '#000'
  return (
    <div className="animate-bubble-in" style={{
      display: 'flex', justifyContent: sent ? 'flex-end' : 'flex-start',
      padding: `0 ${p(9)}px`,
      marginTop: grouped ? 2 : p(8),
    }}>
      <div style={{ position: 'relative', maxWidth: '74%' }}>
        {tail && (
          <svg
            width={p(13)} height={p(19)} viewBox="0 0 13 19"
            style={{
              position: 'absolute', bottom: -0.5,
              ...(sent ? { right: -p(5.5) } : { left: -p(5.5) }),
              transform: sent ? 'scaleX(-1)' : 'none',
              display: 'block',
            }}
          >
            <path d="M12 19c-3 0-6-1-8-3-1.5-1.5-2-3-2-5 0 4 4 8 10 8z" fill={fill}/>
          </svg>
        )}
        <div style={{
          background: fill, color,
          borderRadius: p(18),
          padding: `${p(8)}px ${p(13)}px ${p(9)}px`,
          fontFamily: SF,
          fontSize: p(16.5),
          lineHeight: `${p(21)}px`,
          letterSpacing: -0.2,
          wordWrap: 'break-word',
          position: 'relative', zIndex: 1,
        }}>
          {text}
        </div>
      </div>
    </div>
  )
}

// ── Typing indicator ──────────────────────────────────────────

function TypingBubble({ grouped }: { grouped: boolean }) {
  return (
    <div className="animate-bubble-in" style={{
      display: 'flex', justifyContent: 'flex-start',
      padding: `0 ${p(9)}px`, marginTop: grouped ? 2 : p(8),
    }}>
      <div style={{ position: 'relative' }}>
        <svg
          width={p(13)} height={p(19)} viewBox="0 0 13 19"
          style={{ position: 'absolute', bottom: -0.5, left: -p(5.5), display: 'block' }}
        >
          <path d="M12 19c-3 0-6-1-8-3-1.5-1.5-2-3-2-5 0 4 4 8 10 8z" fill={BUBBLE_GRAY}/>
        </svg>
        <div style={{
          background: BUBBLE_GRAY, borderRadius: p(18),
          padding: `${p(11)}px ${p(14)}px`,
          display: 'flex', gap: p(4), alignItems: 'center',
          position: 'relative', zIndex: 1,
          minWidth: p(50),
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: p(8), height: p(8), borderRadius: '50%',
              background: 'rgba(60,60,67,0.45)',
              animation: `typing-dot 1.3s ${i * 0.18}s ease-in-out infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Date separator ────────────────────────────────────────────

function DateSeparator() {
  return (
    <div style={{
      textAlign: 'center', padding: `${p(8)}px ${p(16)}px ${p(6)}px`,
      fontFamily: SF, fontSize: p(11), color: TEXT_SEC, letterSpacing: -0.1,
    }}>
      <span style={{ fontWeight: 600 }}>Today</span>{' '}
      <span style={{ fontWeight: 400 }}>7:52 AM</span>
    </div>
  )
}

// ── Read receipt ──────────────────────────────────────────────

function ReadReceipt() {
  return (
    <div style={{
      textAlign: 'right', padding: `2px ${p(14)}px 0 0`,
      fontFamily: SF, fontSize: p(11), color: TEXT_SEC, letterSpacing: -0.05,
    }}>Read</div>
  )
}

// ── Input bar ─────────────────────────────────────────────────

function InputBar({ value }: { value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: p(8),
      padding: `${p(7)}px ${p(8)}px ${p(10)}px`,
      background: '#f9f9f9',
    }}>
      <div style={{
        width: p(33), height: p(33), borderRadius: '50%',
        background: '#E5E5EA',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width={p(15)} height={p(15)} viewBox="0 0 15 15">
          <path d="M7.5 1.5v12M1.5 7.5h12" stroke="rgba(60,60,67,0.7)" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{
        flex: 1, minHeight: p(33), borderRadius: p(18),
        border: '0.5px solid rgba(60,60,67,0.25)',
        background: '#fff',
        display: 'flex', alignItems: 'center',
        padding: `${p(6)}px ${p(6)}px ${p(6)}px ${p(14)}px`,
        fontFamily: SF, fontSize: p(16.5),
        color: value ? '#000' : 'rgba(60,60,67,0.5)',
        letterSpacing: -0.2,
      }}>
        <div style={{ flex: 1 }}>{value || 'iMessage'}</div>
        <div style={{ width: p(24), height: p(24), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={p(14)} height={p(20)} viewBox="0 0 14 20" fill="none">
            <rect x="3" y="1" width="8" height="12" rx="4" stroke="rgba(60,60,67,0.7)" strokeWidth="1.4"/>
            <path d="M1 9c0 3.5 2.5 6 6 6s6-2.5 6-6M7 15v3M4 18.5h6" stroke="rgba(60,60,67,0.7)" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export function PhoneMockup() {
  const { chat, composing, showRead, activeIntegration } = useTimeline()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat, showRead])

  const items = useMemo<RichItem[]>(() => {
    return chat.map((c, i) => {
      const next = chat[i + 1]
      const prev = chat[i - 1]
      const from = c.kind === 'typing' ? 'them' : c.from
      const prevFrom = prev ? (prev.kind === 'typing' ? 'them' : prev.from) : null
      const grouped = prevFrom === from
      if (c.kind === 'typing') return { ...c, tail: true, grouped }
      const nextFrom = next ? (next.kind === 'typing' ? 'them' : next.from) : null
      return { ...c, tail: nextFrom !== from, grouped }
    })
  }, [chat])

  const lastMeIdx = useMemo(() => {
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].kind === 'msg' && items[i].from === 'me') return i
    }
    return -1
  }, [items])

  return (
    <div className="select-none" style={{ position: 'relative', display: 'inline-block' }}>
      <OrbitalLogos activeIntegration={activeIntegration} />
      {/* Titanium case ring */}
      <div style={{
        padding: CT,
        borderRadius: p(48) + CT,
        background: 'linear-gradient(145deg, #4a4a4f 0%, #1e1e22 45%, #2f2f34 75%, #0d0d10 100%)',
        boxShadow: [
          `0 ${p(40)}px ${p(80)}px rgba(0,0,0,0.45)`,
          '0 0 0 1px rgba(255,255,255,0.08)',
          'inset 0 1px 0 rgba(255,255,255,0.15)',
          'inset 0 -1px 0 rgba(0,0,0,0.6)',
        ].join(', '),
        position: 'relative',
      }}>
        {/* Phone screen */}
        <div style={{
          width: W, height: H,
          borderRadius: p(48),
          overflow: 'hidden',
          position: 'relative',
          background: '#F2F2F7',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(255,255,255,0.04)',
          fontFamily: SF,
        }}>
          {/* Dynamic Island */}
          <div aria-hidden style={{
            position: 'absolute',
            top: p(11), left: '50%', transform: 'translateX(-50%)',
            width: p(126), height: p(37), borderRadius: p(24),
            background: '#000', zIndex: 50,
          }} />

          <StatusBar />

          {/* Chat scroll — full height; bottom padding reserves space for the cover below */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            <MessagesHeader />
            <div
              ref={scrollRef}
              style={{
                flex: 1, minHeight: 0, overflowY: 'auto',
                padding: `${p(8)}px 0 ${COVER_H + p(4)}px`,
                background: '#fff',
              }}
            >
              <DateSeparator />

              {items.map((item, i) => (
                <Fragment key={item.id}>
                  {item.kind === 'typing' ? (
                    <TypingBubble grouped={item.grouped} />
                  ) : (
                    <Bubble
                      text={item.text!}
                      sent={item.from === 'me'}
                      tail={item.tail}
                      grouped={item.grouped}
                    />
                  )}
                  {showRead && i === lastMeIdx && <ReadReceipt />}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Opaque cover — sits on top of the chat scroll at all times,
              hiding any content that leaks past the scroll area.
              The InputBar and home spacer render inside it. */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: COVER_H,
            zIndex: 30,
            display: 'flex', flexDirection: 'column',
          }}>
            <InputBar value={composing} />
            <div aria-hidden style={{ flex: 1, background: '#f9f9f9' }} />
          </div>

          {/* Home indicator pill — above the cover */}
          <div aria-hidden style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 60,
            height: p(34), display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
            paddingBottom: p(8), pointerEvents: 'none',
          }}>
            <div style={{
              width: p(139), height: p(5), borderRadius: 100,
              background: 'rgba(0,0,0,0.25)',
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}
