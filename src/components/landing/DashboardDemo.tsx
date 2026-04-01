'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

const SCRIPT = [
  { role: 'user' as const, text: "What's on my plate today?" },
  {
    role: 'bot' as const,
    text: "Morning! 2 unread emails from Sarah, your 3pm standup is in 30 mins, and the Q2 report is due Friday. Handle the emails first?",
  },
  { role: 'user' as const, text: "Yes, draft replies. Also push the standup to 4pm." },
  {
    role: 'bot' as const,
    text: "Done — 2 drafts in Gmail. Standup moved to 4pm, team notified.",
  },
  { role: 'user' as const, text: "Remind me about the Q2 report Thursday morning." },
  {
    role: 'bot' as const,
    text: "Reminder set for Thu 9am. I'll prep a draft outline Wednesday night so you're ready to go.",
  },
]

const TABS = ['Chat', 'Tasks', 'Memory', 'Settings'] as const

type Msg = { role: 'user' | 'bot'; text: string }
type Phase = 'user-typing' | 'bot-thinking' | 'bot-typing' | 'reset'

function ChatIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    </svg>
  )
}

function TasksIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  )
}

function MemoryIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm-1-11v6l5 3-.75 1.23L11 15V8h1z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  )
}

const TAB_ICONS: Record<(typeof TABS)[number], ReactNode> = {
  Chat: <ChatIcon />,
  Tasks: <TasksIcon />,
  Memory: <MemoryIcon />,
  Settings: <SettingsIcon />,
}

export function DashboardDemo() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [inputText, setInputText] = useState('')
  const [botDraft, setBotDraft] = useState('')
  const [showDots, setShowDots] = useState(false)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>('user-typing')
  const [charIdx, setCharIdx] = useState(0)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = messagesContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, showDots, botDraft])

  useEffect(() => {
    function clear() {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
    function after(ms: number, fn: () => void) {
      clear()
      timerRef.current = setTimeout(fn, ms)
    }

    if (phase === 'reset') {
      after(2500, () => {
        setMessages([])
        setInputText('')
        setBotDraft('')
        setShowDots(false)
        setStep(0)
        setCharIdx(0)
        setPhase('user-typing')
      })
      return clear
    }

    if (phase === 'user-typing') {
      const text = SCRIPT[step].text
      if (charIdx < text.length) {
        after(20, () => {
          setInputText(text.slice(0, charIdx + 1))
          setCharIdx(c => c + 1)
        })
      } else {
        after(350, () => {
          setMessages(prev => [...prev, { role: 'user', text }])
          setInputText('')
          setStep(s => s + 1)
          setCharIdx(0)
          setPhase('bot-thinking')
        })
      }
      return clear
    }

    if (phase === 'bot-thinking') {
      setShowDots(true)
      after(900, () => {
        setShowDots(false)
        setCharIdx(0)
        setPhase('bot-typing')
      })
      return clear
    }

    if (phase === 'bot-typing') {
      const text = SCRIPT[step].text
      if (charIdx < text.length) {
        after(18, () => {
          setBotDraft(text.slice(0, charIdx + 1))
          setCharIdx(c => c + 1)
        })
      } else {
        after(1200, () => {
          setMessages(prev => [...prev, { role: 'bot', text }])
          setBotDraft('')
          setCharIdx(0)
          const next = step + 1
          if (next >= SCRIPT.length) {
            setStep(0)
            setPhase('reset')
          } else {
            setStep(next)
            setPhase('user-typing')
          }
        })
      }
      return clear
    }

    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, step, charIdx])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <section className="py-16 px-4" id="demo">
      <div className="max-w-6xl mx-auto">
        {/* Responsive wrapper: scales down on mobile, normal on md+ */}
        <div className="demo-scale-wrapper" style={{ padding: '24px 20px', overflow: 'hidden', maxWidth: '100%' }}>
          <div className="demo-scale-inner" style={{ minWidth: '640px' }}>
            {/* Dashboard window */}
            <div
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: '#111827',
                border: '1px solid rgba(37,99,235,0.25)',
                boxShadow: '0 0 24px rgba(37,99,235,0.08), 0 0 60px rgba(37,99,235,0.04)',
                height: '645px',
              }}
            >
              {/* ── Full-width Titlebar ── */}
              <div
                className="flex items-center px-5 py-3.5 border-b border-border flex-shrink-0"
                style={{ background: '#0d1424' }}
              >
                <div className="flex gap-1.5" style={{ minWidth: '72px' }}>
                  <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-sm font-semibold font-heading text-text-base">BirdBot Dashboard</span>
                </div>
                <div className="flex items-center gap-1.5 font-sans" style={{ minWidth: '72px', justifyContent: 'flex-end' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald inline-block" />
                  <span className="text-xs text-emerald">Online</span>
                </div>
              </div>

              {/* ── Body row: sidebar + chat ── */}
              <div className="flex flex-1 min-h-0">

              {/* ── Sidebar ── */}
              <div
                className="flex flex-col border-r border-border flex-shrink-0"
                style={{ width: '176px', background: '#0d1424' }}
              >
                {/* Nav tabs */}
                <nav className="flex flex-col gap-1 p-2 pt-4 flex-1">
                  {TABS.map(tab => {
                    const active = tab === 'Chat'
                    return (
                      <div
                        key={tab}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-sans cursor-default select-none"
                        style={
                          active
                            ? {
                                background: 'rgba(37,99,235,0.15)',
                                color: '#60a5fa',
                                borderLeft: '2px solid #2563eb',
                                paddingLeft: '10px',
                              }
                            : { color: '#64748b' }
                        }
                      >
                        {TAB_ICONS[tab]}
                        {tab}
                      </div>
                    )
                  })}
                </nav>

                {/* User */}
                <div className="px-3 py-3 border-t border-border flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: '#ea580c' }}
                  >
                    J
                  </div>
                  <span className="text-xs font-sans text-text-dim truncate">Jason</span>
                </div>
              </div>

              {/* ── Chat panel ── */}
              <div className="flex flex-col flex-1 min-w-0">

                {/* Messages */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'bot' && (
                        <span className="w-7 h-7 rounded-full bg-blue/20 border border-blue/30 flex items-center justify-center text-sm mr-2.5 mt-0.5 flex-shrink-0">
                          🐦
                        </span>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed font-sans ${
                          msg.role === 'user'
                            ? 'bg-blue text-white rounded-br-sm'
                            : 'bg-panel text-text-base rounded-bl-sm border border-border'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {/* Thinking dots */}
                  {showDots && (
                    <div className="flex justify-start">
                      <span className="w-7 h-7 rounded-full bg-blue/20 border border-blue/30 flex items-center justify-center text-sm mr-2.5 flex-shrink-0">
                        🐦
                      </span>
                      <div className="bg-panel border border-border rounded-2xl rounded-bl-sm px-4 py-3.5 flex gap-1.5 items-center">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce-dot"
                          style={{ animationDelay: '0s' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce-dot"
                          style={{ animationDelay: '0.15s' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce-dot"
                          style={{ animationDelay: '0.3s' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Bot in-progress typewriter */}
                  {phase === 'bot-typing' && botDraft && (
                    <div className="flex justify-start">
                      <span className="w-7 h-7 rounded-full bg-blue/20 border border-blue/30 flex items-center justify-center text-sm mr-2.5 mt-0.5 flex-shrink-0">
                        🐦
                      </span>
                      <div className="max-w-[75%] bg-panel border border-border rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed font-sans text-text-base">
                        {botDraft}
                        <span className="inline-block w-0.5 h-3.5 bg-blue-bright ml-0.5 align-middle animate-pulse" />
                      </div>
                    </div>
                  )}

                </div>

                {/* Input bar */}
                <div className="px-5 py-3.5 border-t border-border flex-shrink-0">
                  <div className="flex items-center gap-3 bg-depth rounded-xl px-4 py-2.5 border border-border">
                    <div className="flex-1 text-sm font-sans min-h-[1.25rem] select-none">
                      {inputText ? (
                        <span className="text-text-base">
                          {inputText}
                          <span className="inline-block w-0.5 h-3.5 bg-text-dim ml-0.5 align-middle animate-pulse" />
                        </span>
                      ) : (
                        <span className="text-text-muted opacity-50">Message BirdBot...</span>
                      )}
                    </div>
                    <button
                      disabled
                      aria-label="Send"
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                        inputText
                          ? 'bg-blue text-white cursor-not-allowed'
                          : 'bg-blue/20 text-blue-bright opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              </div>{/* end body row */}
            </div>{/* end dashboard window */}
          </div>
        </div>
      </div>
    </section>
  )
}
