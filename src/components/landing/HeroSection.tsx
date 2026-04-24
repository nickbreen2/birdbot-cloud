"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"

const WORDS = ["remembering.", "taking notes.", "scheduling.", "drafting emails.", "finding things."]
const LONGEST_WORD = "drafting emails."

export function HeroSection() {
  const { isLoaded, isSignedIn } = useAuth()
  const [isIOS, setIsIOS] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const ua = navigator.userAgent
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    setIsIOS(ios)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setWordIndex(i => (i + 1) % WORDS.length)
        setVisible(true)
      }, 300)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative min-h-[82vh] flex flex-col items-center justify-center px-4 pt-20 pb-8 sm:pt-24 sm:pb-8 overflow-hidden">
      {/* Background atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 45% at 50% 18%, rgba(125,211,252,0.10) 0%, transparent 55%), " +
            "radial-gradient(ellipse 55% 50% at 50% 45%, rgba(37,99,235,0.11) 0%, transparent 70%), " +
            "radial-gradient(ellipse 40% 30% at 72% 32%, rgba(234,179,8,0.06) 0%, transparent 65%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center gap-5">

        {/* Icon with glow halo */}
        <div
          className="relative flex items-center justify-center"
          style={{ animation: "slide-up 0.5s ease both", marginTop: "-20px" }}
        >
          {/* Atmospheric glow ring */}
          <div
            aria-hidden
            className="absolute animate-glow-breath pointer-events-none"
            style={{
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(125,211,252,0.20) 0%, rgba(59,130,246,0.10) 50%, transparent 72%)",
              filter: "blur(20px)",
              ...(isIOS && { transform: "translateZ(0)" }),
            }}
          />
          {/* Inner bright spot */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(186,230,253,0.18) 0%, transparent 70%)",
              filter: "blur(10px)",
              ...(isIOS && { transform: "translateZ(0)" }),
            }}
          />
          {/* Floating icon */}
          <div style={{ animation: "float 4.5s 0.55s ease-in-out infinite", position: "relative" }}>
            <Image
              src="/birdbot-animated (1).svg"
              alt="BirdBot icon"
              width={isIOS ? 125 : 192}
              height={isIOS ? 116 : 179}
              priority
              unoptimized
              className="w-24 h-auto sm:w-auto sm:h-auto"
              style={{
                filter:
                  "drop-shadow(0 8px 32px rgba(125,211,252,0.55)) drop-shadow(0 2px 12px rgba(37,99,235,0.40))",
              }}
            />
          </div>
        </div>

        {/* Headline with rotating word */}
        <h1
          className="font-heading font-bold text-white"
          style={{
            fontSize: "clamp(2.2rem, 5.5vw, 3.8rem)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            animation: "slide-up 0.5s 0.2s ease both",
          }}
        >
          Your AI assistant for
          <br />
          {/* Screen-reader static text — reads the current word in context without re-announcing on every cycle */}
          <span className="sr-only">{WORDS[wordIndex]}</span>
          {/* Visible rotating word — hidden from screen readers */}
          <span className="relative inline-block" aria-hidden="true">
            {/* Invisible longest word — locks container width to prevent layout shift */}
            <span className="invisible select-none">{LONGEST_WORD}</span>
            {/* Absolute overlay fades in/out */}
            <span
              className="absolute inset-0 flex items-center justify-center"
              style={{
                color: "#eab308",
                opacity: visible ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
            >
              {WORDS[wordIndex]}
            </span>
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="max-w-xl text-text-dim text-lg leading-relaxed font-sans"
          style={{ animation: "slide-up 0.5s 0.3s ease both", marginTop: "-4px" }}
        >
          The AI assistant that lives in your messages.<br />Text it, it remembers, it acts.
        </p>

        {/* CTA */}
        <div style={{ animation: "slide-up 0.5s 0.4s ease both" }}>
          <Link
            href={isLoaded && isSignedIn ? "/dashboard" : "/sign-up"}
            className="group inline-flex items-center gap-3 rounded-full font-heading font-semibold text-white transition-all duration-200 hover:scale-[1.025]"
            style={{
              padding: "15px 28px",
              fontSize: "clamp(0.95rem, 1.8vw, 1.05rem)",
              letterSpacing: "0.01em",
              background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #3b82f6 100%)",
              boxShadow: "0 0 36px rgba(37,99,235,0.32), 0 2px 10px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            Try BirdBot free
            <span
              className="inline-flex items-center justify-center rounded-full flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
              style={{
                width: "28px",
                height: "28px",
                background: "rgba(255,255,255,0.18)",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                <path d="M2.5 6.5H10.5M10.5 6.5L7 3M10.5 6.5L7 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </Link>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
        style={{ background: "linear-gradient(to bottom, transparent, #0a0e1a)" }}
      />
    </section>
  )
}
