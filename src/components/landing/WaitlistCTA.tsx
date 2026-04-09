"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"

export function WaitlistCTA() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || submitted) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error("Failed")
      setSubmitted(true)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-28 px-4 bg-surface relative overflow-hidden" id="waitlist">
      {/* Radial blue glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(37,99,235,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto text-center flex flex-col items-center gap-6">
        {/* Icon */}
        <div className="relative flex items-center justify-center">
          <div
            aria-hidden
            className="absolute rounded-full"
            style={{
              width: "120px",
              height: "120px",
              background: "radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(37,99,235,0.15) 50%, transparent 75%)",
              filter: "blur(12px)",
            }}
          />
          <img
            src="/BirdBot-Icon-mark2.svg"
            alt="BirdBot"
            className="relative w-24 h-24 animate-float select-none"
          />
        </div>

        {/* Headline */}
        <div>
          <h2 className="font-heading font-black text-3xl md:text-4xl text-text-base mb-3">
            Stay in the Loop
          </h2>
          <p className="text-text-dim font-sans">
            Get updates on new features, integrations, and bird wisdom. No spam, unsubscribe anytime.
          </p>
        </div>

        {/* Form / Success state */}
        {submitted ? (
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald/10 border border-emerald/30 text-emerald font-sans font-medium text-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            You're subscribed! We'll keep you posted.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col sm:flex-row gap-3"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 px-5 py-3 rounded-xl bg-panel border border-border text-text-base placeholder:text-text-muted font-sans text-sm focus:outline-none focus:border-blue-light transition-colors"
            />
            <Button type="submit" loading={loading} size="md">
              Subscribe
            </Button>
          </form>
        )}

        {error && (
          <p className="text-red-400 text-sm font-sans">
            Something went wrong — please try again.
          </p>
        )}

        <p className="text-text-muted text-xs font-sans">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </section>
  )
}
