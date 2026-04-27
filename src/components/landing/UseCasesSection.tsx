"use client"

import { useEffect, useRef, useState } from "react"
import { UseCaseCard } from "@/components/landing/UseCaseCard"
import { MeetingSchedulingVisual } from "@/components/landing/visuals/MeetingSchedulingVisual"
import { EmailTriageVisual } from "@/components/landing/visuals/EmailTriageVisual"
import { ActionItemsVisual } from "@/components/landing/visuals/ActionItemsVisual"

const CARDS = [
  {
    eyebrow: "MEETING SCHEDULING",
    eyebrowColor: "gold" as const,
    headline: "Your schedule, handled.",
    body: "Just text Birdbot the meeting details. It adds it to your calendar, sets reminders, and reschedules when plans change. No more back-and-forth.",
    visual: <MeetingSchedulingVisual />,
  },
  {
    eyebrow: "EMAIL TRIAGE & DRAFTING",
    eyebrowColor: "blue" as const,
    headline: "Your inbox, organized. Your replies, drafted.",
    body: "Birdbot labels every email and drafts replies in your voice. Just review, edit if needed, and hit send. Important emails get surfaced straight to you via text so you never miss what matters.",
    visual: <EmailTriageVisual />,
  },
  {
    eyebrow: "REMINDERS & ACTION ITEMS",
    eyebrowColor: "gold" as const,
    headline: "Your to-dos tracked. Your follow-ups sent.",
    body: "Birdbot pulls action items from your conversations, reminds you what's due, and follows up so nothing slips through. Tell it once, and it remembers forever.",
    visual: <ActionItemsVisual />,
  },
]

export function UseCasesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setEntered(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="use-cases"
      style={{ background: "#0a0e1a" }}
      className="pt-16 pb-20 md:pt-24 md:pb-28"
    >
      <div
        className="mx-auto px-5 md:px-8"
        style={{ maxWidth: "1200px" }}
      >
        {/* Header */}
        <div className="text-center mb-12 md:mb-20">
          <p
            className="uppercase font-semibold font-sans"
            style={{
              color: "#eab308",
              fontSize: "13px",
              letterSpacing: "0.15em",
              marginBottom: "16px",
            }}
          >
            WHAT YOUR BIRDBOT CAN DO FOR YOU
          </p>
          <h2
            className="font-heading font-bold text-3xl md:text-4xl text-text-base leading-tight"
            style={{ marginBottom: "12px" }}
          >
            Ways your Birdbot<br />can assist you
          </h2>
          <p
            className="font-sans"
            style={{
              fontSize: "clamp(17px, 2vw, 20px)",
              color: "#94a3b8",
            }}
          >
            Text it. It handles the rest.
          </p>
        </div>

        {/* Cards stack */}
        <div className="flex flex-col gap-8 md:gap-16">
          {CARDS.map((card, i) => (
            <div
              key={i}
              style={{
                opacity: entered ? undefined : 0,
                ...(entered && {
                  animation: `slide-up 0.6s ${i * 0.15}s ease-out both`,
                }),
              }}
            >
              <UseCaseCard
                eyebrow={card.eyebrow}
                eyebrowColor={card.eyebrowColor}
                headline={card.headline}
                body={card.body}
                visual={card.visual}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
