"use client"

import BirdbotIMessage from "@/components/birdbot/BirdbotIMessage"

// Full device dimensions (402 wide + 10px case on each side, 874 tall + 10px case on each side)
const DEVICE_W = 422
const DEVICE_H = 894
const SCALE = 0.64

export function ConversationDemo() {
  return (
    <section className="py-20 px-4 overflow-hidden" id="demo">
      <div aria-hidden="true" className="flex justify-center">
        {/*
          scale() doesn't affect layout dimensions, so we set the outer container
          to the visual (scaled) size and position the phone absolutely inside it.
        */}
        <div
          style={{
            width: Math.round(DEVICE_W * SCALE),
            height: Math.round(DEVICE_H * SCALE),
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: DEVICE_W,
              height: DEVICE_H,
              transform: `scale(${SCALE})`,
              transformOrigin: "top left",
            }}
          >
            <BirdbotIMessage />
          </div>
        </div>
      </div>

      {/* Screen reader version of the conversation */}
      <div className="sr-only">
        <p>Conversation between you and Birdbot:</p>
        <p>Birdbot: morning! you&#39;ve got 16 unread emails and a meeting with Sarah at 2pm</p>
        <p>Birdbot: want me to draft replies and send you a prep doc?</p>
        <p>You: yes + find the q3 notes we talked about</p>
        <p>Birdbot: ✓ 3 drafts ready in Gmail</p>
        <p>Birdbot: ✓ prep doc saved to your calendar invite</p>
        <p>Birdbot: q3 notes — you asked me to remember &quot;pricing lands at $29&quot; last Tuesday</p>
      </div>
    </section>
  )
}
