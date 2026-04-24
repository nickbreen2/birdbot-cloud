"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"

const MESSAGES = [
  { from: "bird", text: "morning! you've got 16 unread emails and a meeting with Sarah at 2pm" },
  { from: "bird", text: "want me to draft replies and send you a prep doc?" },
  { from: "user", text: "yes + find the q3 notes we talked about" },
  { from: "bird", text: "✓ 3 drafts ready in Gmail" },
  { from: "bird", text: "✓ prep doc saved to your calendar invite" },
  { from: "bird", text: 'q3 notes — you asked me to remember "pricing lands at $29" last Tuesday' },
] as const

// Timeline: each event fires at this ms offset from loop start
const TIMELINE = [
  { at: 400,   action: "typing" },
  { at: 1400,  action: "msg0" },
  { at: 2200,  action: "typing" },
  { at: 3200,  action: "msg1" },
  { at: 5000,  action: "msg2" },   // user message — no typing indicator
  { at: 5800,  action: "typing" },
  { at: 7000,  action: "msg3" },
  { at: 7800,  action: "typing" },
  { at: 8800,  action: "msg4" },
  { at: 9600,  action: "typing" },
  { at: 11000, action: "msg5" },
  { at: 15000, action: "reset" },
] as const

type TimelineAction = (typeof TIMELINE)[number]["action"]

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-2">
      <div
        className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
        style={{ background: "#e5e5ea" }}
      >
        <Image
          src="/birdbot-animated (1).svg"
          alt=""
          width={32}
          height={32}
          unoptimized
          aria-hidden
        />
      </div>
      <div
        className="flex items-center gap-1 px-4 py-3 rounded-[20px] rounded-bl-[4px]"
        style={{ background: "#e5e5ea" }}
      >
        <span
          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "0ms", animationDuration: "1s" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "160ms", animationDuration: "1s" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "320ms", animationDuration: "1s" }}
        />
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  msg: (typeof MESSAGES)[number]
  visible: boolean
}

function MessageBubble({ msg, visible }: MessageBubbleProps) {
  const isUser = msg.from === "user"
  return (
    <div
      className={`flex items-end gap-2 mb-2 ${isUser ? "justify-end" : "justify-start"}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}
    >
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
          style={{ background: "#e5e5ea" }}
        >
          <Image
            src="/birdbot-animated (1).svg"
            alt=""
            width={32}
            height={32}
            unoptimized
            aria-hidden
          />
        </div>
      )}
      <div
        className="max-w-[75%] px-4 py-2.5 text-[15px] leading-snug"
        style={{
          background: isUser ? "#007AFF" : "#e5e5ea",
          color: isUser ? "#fff" : "#000",
          borderRadius: isUser
            ? "20px 20px 4px 20px"
            : "20px 20px 20px 4px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {msg.text}
      </div>
    </div>
  )
}

export function PhoneMockup() {
  const [visibleMessages, setVisibleMessages] = useState<Set<number>>(new Set())
  const [showTyping, setShowTyping] = useState(false)
  const [started, setStarted] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (started) return
    setStarted(true)

    function clearAll() {
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
    }

    function schedule(at: number, fn: () => void) {
      const id = setTimeout(fn, at)
      timeoutsRef.current.push(id)
    }

    function runLoop() {
      clearAll()
      setVisibleMessages(new Set())
      setShowTyping(false)

      for (const { at, action } of TIMELINE) {
        const a = action as TimelineAction
        if (a === "typing") {
          schedule(at, () => setShowTyping(true))
        } else if (a === "reset") {
          schedule(at, () => {
            runLoop()
          })
        } else {
          const idx = parseInt(a.replace("msg", ""), 10)
          schedule(at, () => {
            setShowTyping(false)
            setVisibleMessages(prev => new Set([...prev, idx]))
          })
        }
      }
    }

    runLoop()
    return clearAll
  }, [started])

  // Auto-scroll to bottom whenever content changes
  useEffect(() => {
    const el = chatRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [visibleMessages, showTyping])

  return (
    <div
      className="relative mx-auto select-none"
      style={{
        width: "340px",
        maxWidth: "100%",
        borderRadius: "50px",
        background: "#1a1a1a",
        padding: "10px",
        boxShadow:
          "0 40px 80px rgba(0,0,0,0.55), 0 8px 20px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.08)",
      }}
    >
      {/* Screen */}
      <div
        style={{
          borderRadius: "42px",
          overflow: "hidden",
          background: "#f2f2f7",
          display: "flex",
          flexDirection: "column",
          height: "620px",
        }}
      >
        {/* Dynamic Island */}
        <div
          className="flex justify-center pt-3 pb-1 flex-shrink-0"
          style={{ background: "#f2f2f7" }}
        >
          <div
            style={{
              width: "120px",
              height: "34px",
              background: "#000",
              borderRadius: "20px",
            }}
          />
        </div>

        {/* Status bar */}
        <div
          className="flex items-center justify-between px-6 pb-1 flex-shrink-0"
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}
        >
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#000" }}>9:41</span>
          <div className="flex items-center gap-1.5">
            {/* Signal bars */}
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
              <rect x="0" y="8" width="3" height="4" rx="0.5" fill="#000" />
              <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" fill="#000" />
              <rect x="9" y="3" width="3" height="9" rx="0.5" fill="#000" />
              <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="#000" opacity="0.3" />
            </svg>
            {/* WiFi */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill="#000" />
              <path d="M3.5 6.5A6.5 6.5 0 0 1 8 4.5a6.5 6.5 0 0 1 4.5 2" stroke="#000" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              <path d="M1 3.5A10.5 10.5 0 0 1 8 1a10.5 10.5 0 0 1 7 2.5" stroke="#000" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            </svg>
            {/* Battery */}
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="#000" strokeOpacity="0.35" />
              <rect x="2" y="2" width="17" height="8" rx="2" fill="#000" />
              <path d="M23 4v4a2 2 0 0 0 0-4z" fill="#000" fillOpacity="0.4" />
            </svg>
          </div>
        </div>

        {/* iMessage chat header */}
        <div
          className="flex items-center px-4 py-2 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.12)" }}
        >
          {/* Back arrow */}
          <button className="flex items-center gap-0.5 text-[#007AFF] mr-2" aria-label="Back" tabIndex={-1}>
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
              <path d="M9 1L1 8.5L9 16" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Bird avatar + name — centered */}
          <div className="flex-1 flex flex-col items-center">
            <div
              className="w-10 h-10 rounded-full overflow-hidden"
              style={{ background: "#e5e5ea" }}
            >
              <Image
                src="/birdbot-animated (1).svg"
                alt="Bird"
                width={40}
                height={40}
                unoptimized
                priority
              />
            </div>
            <span
              style={{
                fontSize: "12px",
                color: "#000",
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: 400,
                marginTop: "2px",
              }}
            >
              Bird
            </span>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-4 ml-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.63 19.79 19.79 0 01.06 2 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
        </div>

        {/* Chat area */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto px-3 pt-4 pb-2"
          style={{ scrollBehavior: "smooth" }}
        >
          {/* Timestamp */}
          <div
            className="text-center mb-4"
            style={{
              fontSize: "12px",
              color: "#8e8e93",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            Today 7:52 AM
          </div>

          {/* Messages */}
          {MESSAGES.map((msg, i) => (
            <MessageBubble key={i} msg={msg} visible={visibleMessages.has(i)} />
          ))}

          {/* Typing indicator */}
          {showTyping && <TypingIndicator />}
        </div>

        {/* Input bar */}
        <div
          className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(0,0,0,0.12)", background: "#f2f2f7" }}
        >
          <button aria-label="Add" tabIndex={-1}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#8e8e93" strokeWidth="1.5" />
              <path d="M14 9v10M9 14h10" stroke="#8e8e93" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <div
            className="flex-1 flex items-center px-3"
            style={{
              height: "34px",
              border: "1px solid #c7c7cc",
              borderRadius: "17px",
              background: "#fff",
              fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: "15px",
              color: "#8e8e93",
            }}
          >
            iMessage
          </div>
          <button aria-label="Camera" tabIndex={-1}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#8e8e93" strokeWidth="1.5" />
              <path d="M9 11a1 1 0 011-1h1l1.5-2h3L17 10h1a1 1 0 011 1v6a1 1 0 01-1 1H9a1 1 0 01-1-1v-6z" stroke="#8e8e93" strokeWidth="1.2" fill="none" />
              <circle cx="14" cy="14" r="2" stroke="#8e8e93" strokeWidth="1.2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
