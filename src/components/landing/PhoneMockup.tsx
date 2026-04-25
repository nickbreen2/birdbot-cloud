"use client"

import Image from "next/image"
import { Fragment, useEffect, useState } from "react"

const MESSAGES = [
  { from: "bird", text: "morning! you've got 16 unread emails and a meeting with Sarah at 2pm" },
  { from: "bird", text: "want me to draft replies and send you a prep doc?" },
  { from: "user", text: "yes + find the q3 notes we talked about" },
  { from: "bird", text: "✓ 3 drafts ready in Gmail" },
  { from: "bird", text: "✓ prep doc saved to your calendar invite" },
  { from: "bird", text: 'q3 notes — you asked me to remember "pricing lands at $29" last Tuesday' },
] as const

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-1.5">
      <div className="flex items-center gap-1 px-3.5 py-3 rounded-[18px] rounded-bl-[4px]" style={{ background: "#e5e5ea" }}>
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce-dot" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce-dot" style={{ animationDelay: "200ms" }} />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce-dot" style={{ animationDelay: "400ms" }} />
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  msg: (typeof MESSAGES)[number]
  visible: boolean
  isNewSender: boolean
  tightBottom?: boolean
}

function MessageBubble({ msg, visible, isNewSender, tightBottom }: MessageBubbleProps) {
  const isUser = msg.from === "user"
  const mb = tightBottom ? "mb-0" : isNewSender ? "mb-3" : "mb-1.5"
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} ${mb}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}
    >
      <div
        className={`max-w-[70%] px-3.5 py-2 text-[14px] leading-snug ${
          isUser ? "rounded-[18px] rounded-br-[4px]" : "rounded-[18px] rounded-bl-[4px]"
        }`}
        style={{
          background: isUser ? "#007AFF" : "#e5e5ea",
          color: isUser ? "#fff" : "#000",
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

  useEffect(() => {
    let cancelled = false

    function delay(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms))
    }

    async function runLoop() {
      while (!cancelled) {
        setVisibleMessages(new Set())
        setShowTyping(false)

        await delay(400);  if (cancelled) return
        setShowTyping(true)

        await delay(1000); if (cancelled) return
        setShowTyping(false)
        setVisibleMessages(new Set([0]))

        await delay(800);  if (cancelled) return
        setShowTyping(true)

        await delay(1000); if (cancelled) return
        setShowTyping(false)
        setVisibleMessages(prev => new Set([...prev, 1]))

        await delay(1800); if (cancelled) return
        setVisibleMessages(prev => new Set([...prev, 2]))

        await delay(800);  if (cancelled) return
        setShowTyping(true)

        await delay(1200); if (cancelled) return
        setShowTyping(false)
        setVisibleMessages(prev => new Set([...prev, 3]))

        await delay(800);  if (cancelled) return
        setShowTyping(true)

        await delay(1000); if (cancelled) return
        setShowTyping(false)
        setVisibleMessages(prev => new Set([...prev, 4]))

        await delay(800);  if (cancelled) return
        setShowTyping(true)

        await delay(1400); if (cancelled) return
        setShowTyping(false)
        setVisibleMessages(prev => new Set([...prev, 5]))

        await delay(4000); if (cancelled) return
      }
    }

    runLoop()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="relative mx-auto select-none" style={{ width: "310px", maxWidth: "100%" }}>
      {/* iPhone frame — drop shadow lifts it off the dark page background */}
      <Image
        src="/iphone-frame.svg"
        alt=""
        width={1800}
        height={3630}
        unoptimized
        aria-hidden
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          filter: "drop-shadow(0 28px 70px rgba(0,0,0,0.7)) drop-shadow(0 4px 16px rgba(0,0,0,0.45))",
        }}
      />

      {/* iMessage UI — overlaid on the screen area */}
      <div
        style={{
          position: "absolute",
          left: "5.64%",
          top: "2.36%",
          width: "88.71%",
          height: "95.28%",
          borderRadius: "35px",
          overflow: "hidden",
          background: "#f2f2f7",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Status bar — Dynamic Island centered, time left, icons right, all one row */}
        <div
          className="relative flex items-center flex-shrink-0 px-5"
          style={{ height: "54px" }}
        >
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#000", lineHeight: 1, position: "relative", zIndex: 1 }}>
            9:41
          </span>
          {/* Dynamic Island pill — absolute center of the row */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "126px",
              height: "37px",
              background: "#000",
              borderRadius: "22px",
            }}
          />
          <div className="ml-auto flex items-center gap-1.5" style={{ position: "relative", zIndex: 1 }}>
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
              <rect x="0" y="8" width="3" height="4" rx="0.5" fill="#000" />
              <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.5" fill="#000" />
              <rect x="9" y="3" width="3" height="9" rx="0.5" fill="#000" />
              <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="#000" opacity="0.3" />
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill="#000" />
              <path d="M3.5 6.5A6.5 6.5 0 0 1 8 4.5a6.5 6.5 0 0 1 4.5 2" stroke="#000" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              <path d="M1 3.5A10.5 10.5 0 0 1 8 1a10.5 10.5 0 0 1 7 2.5" stroke="#000" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="#000" strokeOpacity="0.35" />
              <rect x="2" y="2" width="17" height="8" rx="2" fill="#000" />
              <path d="M23 4v4a2 2 0 0 0 0-4z" fill="#000" fillOpacity="0.4" />
            </svg>
          </div>
        </div>

        {/* iMessage header — three-column, true center */}
        <div
          className="flex items-center px-4 py-2 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.1)" }}
        >
          <div style={{ width: "32px" }}>
            <button className="flex items-center" aria-label="Back" tabIndex={-1}>
              <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
                <path d="M9 1L1 8.5L9 16" stroke="#007AFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <Image src="/birdbot-animated (1).svg" alt="Bird" width={32} height={32} unoptimized priority />
            </div>
            <span style={{ fontSize: "11px", color: "#007AFF", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 400, marginTop: "1px" }}>
              Bird ›
            </span>
          </div>

          <div style={{ width: "32px" }} />
        </div>

        {/* Chat area — white background, no auto-scroll so msg0 is always visible */}
        <div
          className="flex-1 overflow-y-hidden px-3 pt-3 pb-2"
          style={{ background: "#fff" }}
        >
          <div
            className="text-center mb-3"
            style={{ fontSize: "11px", fontWeight: 500, color: "#8e8e93", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}
          >
            Today 7:52 AM
          </div>

          {MESSAGES.map((msg, i) => {
            const isNewSender = i === 0 || MESSAGES[i - 1].from !== msg.from
            return (
              <Fragment key={i}>
                <MessageBubble
                  msg={msg}
                  visible={visibleMessages.has(i)}
                  isNewSender={isNewSender}
                  tightBottom={i === 2}
                />
                {i === 2 && visibleMessages.has(2) && !visibleMessages.has(3) && (
                  <div
                    className="text-right"
                    style={{
                      fontSize: "10px",
                      fontWeight: 500,
                      color: "#8e8e93",
                      marginTop: "3px",
                      marginBottom: "10px",
                      paddingRight: "4px",
                      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                    }}
                  >
                    Delivered
                  </div>
                )}
              </Fragment>
            )
          })}

          {showTyping && <TypingIndicator />}
        </div>

        {/* Input bar */}
        <div
          className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(0,0,0,0.1)", background: "#f2f2f7" }}
        >
          <button aria-label="Add" tabIndex={-1}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#8e8e93" strokeWidth="1.5" />
              <path d="M14 9v10M9 14h10" stroke="#8e8e93" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <div
            className="flex-1 flex items-center px-3"
            style={{ height: "34px", border: "1px solid #c7c7cc", borderRadius: "17px", background: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "15px", color: "#8e8e93" }}
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
