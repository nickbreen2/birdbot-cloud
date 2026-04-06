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
        {/* Star dots — scattered white specks for atmosphere */}
        {[
          [8, 12], [15, 55], [22, 88], [31, 33], [42, 71], [55, 18],
          [63, 82], [71, 44], [82, 9],  [90, 67], [96, 30], [4, 76],
          [37, 95], [50, 6],  [78, 92], [18, 40], [88, 52], [60, 60],
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
              opacity: 0.15 + (i % 4) * 0.06,
            }}
          />
        ))}

        {/* Deep blue atmospheric glow behind center content */}
        <div
          style={{
            position: "absolute",
            width: "900px",
            height: "560px",
            borderRadius: "50%",
            backgroundImage:
              "radial-gradient(ellipse at center, rgba(37,99,235,0.22) 0%, rgba(14,30,80,0.12) 45%, transparent 72%)",
            top: "50%",
            left: "50%",
            marginTop: "-280px",
            marginLeft: "-450px",
          }}
        />

        {/* Soft sky-blue upper halo */}
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "300px",
            borderRadius: "50%",
            backgroundImage:
              "radial-gradient(ellipse at center, rgba(125,211,252,0.10) 0%, transparent 68%)",
            top: "0px",
            left: "50%",
            marginLeft: "-300px",
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

          {/* Tagline — spaced uppercase sky blue, matching hero subheadline */}
          <div
            style={{
              fontSize: "20px",
              fontWeight: 300,
              letterSpacing: "12px",
              textTransform: "uppercase",
              color: "rgba(186,230,253,0.70)",
              marginTop: "4px",
              display: "flex",
            }}
          >
            Your AI Companion
          </div>

          {/* Thin divider line */}
          <div
            style={{
              width: "80px",
              height: "1px",
              backgroundImage:
                "linear-gradient(90deg, transparent, rgba(125,211,252,0.45), transparent)",
              margin: "20px 0",
              display: "flex",
            }}
          />

          {/* Description */}
          <div
            style={{
              fontSize: "22px",
              color: "rgba(148,163,184,0.85)",
              textAlign: "center",
              maxWidth: "720px",
              lineHeight: 1.5,
              display: "flex",
              textWrap: "balance",
            }}
          >
            Deploy your personal AI agent in seconds. Automates tasks, browses
            the web, and connects to your apps — running 24/7.
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
