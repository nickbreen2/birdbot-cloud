"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"

export function HeroSection() {
  const { isLoaded, isSignedIn } = useAuth()
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    setIsIOS(ios)
  }, [])
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-32 pb-20 sm:pt-36 sm:pb-16 overflow-hidden">
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
              style={{
                filter:
                  "drop-shadow(0 8px 32px rgba(125,211,252,0.55)) drop-shadow(0 2px 12px rgba(37,99,235,0.40))",
              }}
            />
          </div>
        </div>

        {/* BirdBot wordmark */}
        <div style={{ animation: "slide-up 0.5s 0.2s ease both", marginTop: "-12px" }}>
          <span
            className="font-heading font-black leading-none block select-none"
            style={{
              fontSize: "clamp(4.2rem, 12vw, 9rem)",
              letterSpacing: "-0.035em",
              background: "linear-gradient(155deg, #ffffff 0%, #e0f2fe 25%, #bae6fd 48%, #93c5fd 72%, #60a5fa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            BirdBot
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-heading font-light tracking-widest"
          style={{
            fontSize: "clamp(0.85rem, 2vw, 1.15rem)",
            color: "rgba(186,230,253,0.70)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            animation: "slide-up 0.5s 0.3s ease both",
            marginTop: "-6px",
          }}
        >
          Your AI Companion
        </h1>

        {/* Divider */}
        <div
          aria-hidden
          style={{
            width: "40px",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(125,211,252,0.35), transparent)",
            animation: "slide-up 0.5s 0.35s ease both",
            marginTop: "-4px",
          }}
        />

        {/* Subheadline */}
        <p
          className="max-w-xl text-text-dim text-lg leading-relaxed font-sans"
          style={{ animation: "slide-up 0.5s 0.4s ease both", marginTop: "-4px" }}
        >
          Deploy your personal AI agent in seconds. It automates tasks, browses
          the web, manages files, and connects to your apps — running 24/7, no
          setup required.
        </p>

        {/* CTA */}
        <div style={{ animation: "slide-up 0.5s 0.5s ease both" }}>
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
            {isLoaded && isSignedIn ? "Go to Dashboard" : "Create your BirdBot Agent"}
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

        {/* Early-access text */}
        <p
          className="text-gold-light font-medium text-sm font-sans"
          style={{ animation: "slide-up 0.5s 0.6s ease both" }}
        >
          Now accepting early access signups
        </p>
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
