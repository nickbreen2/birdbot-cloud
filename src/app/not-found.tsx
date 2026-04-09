import Image from "next/image"
import Link from "next/link"
import { StarField } from "@/components/StarField"

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-depth text-text-base flex flex-col items-center justify-center px-4">
      <StarField />

      {/* Atmospheric blue glow behind the icon */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(125,211,252,0.13) 0%, rgba(37,99,235,0.08) 45%, transparent 72%)",
          filter: "blur(32px)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -62%)",
          zIndex: 0,
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Floating bird icon — same size and glow as the hero */}
        <div
          className="relative flex items-center justify-center"
          style={{ marginBottom: "8px" }}
        >
          {/* Outer atmospheric ring */}
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
              background:
                "radial-gradient(circle, rgba(186,230,253,0.18) 0%, transparent 70%)",
              filter: "blur(10px)",
            }}
          />
          {/* Icon */}
          <div style={{ animation: "float 4.5s 0.2s ease-in-out infinite", position: "relative" }}>
            <Image
              src="/BirdBot-Icon-mark2.svg"
              alt="BirdBot"
              width={160}
              height={149}
              priority
              style={{
                filter:
                  "drop-shadow(0 8px 32px rgba(125,211,252,0.55)) drop-shadow(0 2px 12px rgba(37,99,235,0.40))",
              }}
            />
          </div>
        </div>

        {/* 404 */}
        <div
          className="font-heading font-black leading-none select-none"
          style={{
            fontSize: "clamp(5rem, 18vw, 10rem)",
            letterSpacing: "-0.04em",
            background:
              "linear-gradient(155deg, #ffffff 0%, #e0f2fe 25%, #bae6fd 48%, #93c5fd 72%, #60a5fa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </div>

        {/* Label */}
        <p
          className="font-heading font-light tracking-widest text-sm uppercase"
          style={{
            color: "rgba(186,230,253,0.65)",
            letterSpacing: "0.22em",
            marginTop: "-20px",
          }}
        >
          Page Not Found
        </p>

        {/* Message */}
        <p className="text-text-dim font-sans text-base max-w-xs leading-relaxed">
          This page flew the nest. Head back and we&apos;ll find you the right
          perch.
        </p>

        {/* Back home button */}
        <Link
          href="/"
          className="group inline-flex items-center gap-3 rounded-full font-heading font-semibold text-white transition-all duration-200 hover:scale-[1.025]"
          style={{
            marginTop: "8px",
            padding: "14px 28px",
            fontSize: "0.95rem",
            letterSpacing: "0.01em",
            background:
              "linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #3b82f6 100%)",
            boxShadow:
              "0 0 36px rgba(37,99,235,0.32), 0 2px 10px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)",
          }}
        >
          Back to Home
          <span
            className="inline-flex items-center justify-center rounded-full flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
            style={{
              width: "26px",
              height: "26px",
              background: "rgba(255,255,255,0.18)",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 13 13"
              fill="none"
              aria-hidden
            >
              <path
                d="M2.5 6.5H10.5M10.5 6.5L7 3M10.5 6.5L7 10"
                stroke="white"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  )
}
