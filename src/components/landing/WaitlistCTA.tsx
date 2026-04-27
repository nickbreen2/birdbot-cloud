import Link from "next/link"

export function WaitlistCTA() {
  return (
    <section className="pt-14 pb-16 px-5 md:pt-24 md:pb-28 md:px-4 bg-surface relative overflow-hidden" id="cta">
      {/* Radial blue glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(37,99,235,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto text-center flex flex-col items-center gap-5 md:gap-6">
        {/* Icon */}
        <div className="relative flex items-center justify-center">
          <div
            aria-hidden
            className="absolute rounded-full"
            style={{
              width: "100px",
              height: "100px",
              background: "radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(37,99,235,0.15) 50%, transparent 75%)",
              filter: "blur(12px)",
            }}
          />
          <img
            src="/birdbot-animated (2).svg"
            alt="BirdBot"
            className="relative w-20 h-20 md:w-24 md:h-24 animate-float select-none"
          />
        </div>

        {/* Headline + subhead */}
        <div className="flex flex-col gap-2">
          <h2 className="font-heading font-black text-3xl md:text-4xl text-text-base">
            Start saving your time.
          </h2>
          <p className="text-text-dim font-sans text-[15px] md:text-base leading-relaxed">
            Your messages, meetings, and to-dos — all handled.<br className="hidden sm:block" /> Text it once, never forget again.
          </p>
        </div>

        {/* CTA Button */}
        <Link
          href="/sign-up"
          className="group inline-flex items-center gap-3 rounded-2xl font-heading font-semibold text-white transition-all duration-200 hover:scale-[1.025]"
          style={{
            padding: "13px 24px",
            fontSize: "1rem",
            letterSpacing: "0.01em",
            background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #3b82f6 100%)",
            boxShadow: "0 0 36px rgba(37,99,235,0.32), 0 2px 10px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)",
          }}
        >
          Try BirdBot free
          <span
            className="inline-flex items-center justify-center rounded-full flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
            style={{
              width: "26px",
              height: "26px",
              background: "rgba(255,255,255,0.18)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 13 13" fill="none" aria-hidden>
              <path d="M2.5 6.5H10.5M10.5 6.5L7 3M10.5 6.5L7 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </Link>
      </div>
    </section>
  )
}
