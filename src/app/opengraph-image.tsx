import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0e1a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Star dots — matches hero atmosphere */}
        {[
          [8, 12], [15, 55], [22, 88], [31, 33], [42, 71], [55, 18],
          [63, 82], [71, 44], [82, 9],  [90, 67], [96, 30], [4, 76],
          [37, 95], [50, 6],  [78, 92], [18, 40], [88, 52], [60, 60],
          [25, 20], [70, 75], [45, 48], [10, 90], [85, 35],
        ].map(([x, y], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: i % 3 === 0 ? "2px" : "1px",
              height: i % 3 === 0 ? "2px" : "1px",
              borderRadius: "50%",
              backgroundColor: "white",
              opacity: 0.12 + (i % 4) * 0.07,
            }}
          />
        ))}

        {/* Hero atmosphere — same radial-gradient layers as HeroSection */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(ellipse 65% 45% at 50% 18%, rgba(125,211,252,0.12) 0%, transparent 55%), " +
              "radial-gradient(ellipse 55% 50% at 50% 45%, rgba(37,99,235,0.13) 0%, transparent 70%), " +
              "radial-gradient(ellipse 40% 30% at 72% 32%, rgba(234,179,8,0.07) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0px",
            position: "relative",
          }}
        >
          {/* BirdBot wordmark — white/sky-blue gradient matching the hero */}
          <div
            style={{
              fontSize: "128px",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-4px",
              background:
                "linear-gradient(155deg, #ffffff 0%, #e0f2fe 25%, #bae6fd 48%, #93c5fd 72%, #60a5fa 100%)",
              backgroundClip: "text",
              color: "transparent",
              display: "flex",
            }}
          >
            BirdBot
          </div>

          {/* Subheadline — matches hero "The AI assistant that lives in your messages" */}
          <div
            style={{
              fontSize: "26px",
              fontWeight: 300,
              letterSpacing: "1px",
              color: "rgba(186,230,253,0.70)",
              marginTop: "8px",
              display: "flex",
            }}
          >
            The AI assistant that lives in your messages
          </div>

          {/* Thin divider line */}
          <div
            style={{
              width: "80px",
              height: "1px",
              backgroundImage:
                "linear-gradient(90deg, transparent, rgba(125,211,252,0.45), transparent)",
              margin: "22px 0",
              display: "flex",
            }}
          />

          {/* Hero copy with yellow accent — mirrors the rotating word color #eab308 */}
          <div
            style={{
              fontSize: "24px",
              textAlign: "center",
              maxWidth: "760px",
              lineHeight: 1.5,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span style={{ color: "rgba(148,163,184,0.85)" }}>Text it,</span>
            <span style={{ color: "#eab308", fontWeight: 500 }}>it remembers.</span>
            <span style={{ color: "rgba(148,163,184,0.85)" }}>Text it,</span>
            <span style={{ color: "#eab308", fontWeight: 500 }}>it acts.</span>
          </div>

          {/* Domain pill */}
          <div
            style={{
              display: "flex",
              marginTop: "36px",
              padding: "10px 28px",
              backgroundColor: "rgba(37,99,235,0.18)",
              border: "1px solid rgba(59,130,246,0.40)",
              borderRadius: "40px",
              fontSize: "20px",
              color: "#60a5fa",
              fontWeight: 500,
              letterSpacing: "0.5px",
            }}
          >
            birdbot.ai
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
