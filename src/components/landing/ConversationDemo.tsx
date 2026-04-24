"use client"

import { OrbitalLogos, LogoRow } from "./OrbitalLogos"
import { PhoneMockup } from "./PhoneMockup"

export function ConversationDemo() {
  return (
    <section className="py-20 px-4 overflow-hidden" id="demo">
      {/* Section heading */}
      <div className="text-center mb-12">
        <h2
          className="font-heading font-bold text-white"
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          Bird in your messages
        </h2>
        <p
          className="mt-3 font-sans text-text-dim text-base sm:text-lg max-w-md mx-auto"
          style={{ lineHeight: 1.6 }}
        >
          Text it like a friend. It remembers everything and acts on your tools.
        </p>
      </div>

      {/* Visual demo — aria-hidden, all animation is decorative */}
      <div aria-hidden="true">
        {/* Desktop orbital layout — lg+ only */}
        <div
          className="relative mx-auto hidden lg:block"
          style={{ width: "740px", height: "700px" }}
        >
          {/* Phone — absolutely centered in the container */}
          <div style={{ position: "absolute", left: "200px", top: "20px" }}>
            <PhoneMockup />
          </div>
          {/* Orbital logos + SVG connector lines */}
          <OrbitalLogos />
        </div>

        {/* Mobile / tablet layout — below lg */}
        <div className="flex flex-col items-center gap-10 lg:hidden">
          <PhoneMockup />
          <LogoRow />
        </div>
      </div>

      {/* Screen reader version of the conversation */}
      <div className="sr-only">
        <p>Conversation between you and Bird:</p>
        <p>Bird: morning! you&#39;ve got 16 unread emails and a meeting with Sarah at 2pm</p>
        <p>Bird: want me to draft replies and send you a prep doc?</p>
        <p>You: yes + find the q3 notes we talked about</p>
        <p>Bird: ✓ 3 drafts ready in Gmail</p>
        <p>Bird: ✓ prep doc saved to your calendar invite</p>
        <p>Bird: q3 notes — you asked me to remember &quot;pricing lands at $29&quot; last Tuesday</p>
      </div>
    </section>
  )
}
