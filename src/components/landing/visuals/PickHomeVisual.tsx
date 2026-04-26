import Image from "next/image"

const CONTAINER = 200
const RADIUS = 75
const ICON_SIZE = 40

// Pre-positioned at 0°, 120°, 240° CW from the right — no animation delays needed
const ICONS = [
  { id: "telegram", src: "/Telegram.svg", alt: "Telegram", angle: 0   },
  { id: "imessage", src: "/IMessage.svg", alt: "iMessage", angle: 120 },
  { id: "whatsapp", src: "/Whatsapp.svg", alt: "WhatsApp", angle: 240 },
]

export function PickHomeVisual() {
  return (
    <div
      style={{
        position: "relative",
        width: CONTAINER,
        height: CONTAINER,
        margin: "0 auto",
        borderRadius: "50%",
        background:
          "radial-gradient(circle at center, rgba(125,211,252,0.13) 0%, rgba(37,99,235,0.07) 45%, transparent 70%)",
      }}
    >
      {/* Faint static orbital ring */}
      <svg
        width={CONTAINER}
        height={CONTAINER}
        viewBox={`0 0 ${CONTAINER} ${CONTAINER}`}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        aria-hidden
      >
        <circle
          cx={CONTAINER / 2}
          cy={CONTAINER / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
      </svg>

      {/* Bird — centered */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 2,
        }}
      >
        <Image
          src="/birdbot-animated (1).svg"
          alt="BirdBot"
          width={70}
          height={70}
          unoptimized
          style={{
            filter:
              "drop-shadow(0 0 18px rgba(125,211,252,0.55)) drop-shadow(0 2px 8px rgba(37,99,235,0.40))",
          }}
        />
      </div>

      {/* Rotating ring — carries all icons; negative margins center it without transform conflict */}
      <div
        className="animate-orbit-cw"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: RADIUS * 2,
          height: RADIUS * 2,
          marginLeft: -RADIUS,
          marginTop: -RADIUS,
          zIndex: 3,
        }}
      >
        {ICONS.map((icon) => {
          const rad = (icon.angle * Math.PI) / 180
          const x = RADIUS + RADIUS * Math.cos(rad) - ICON_SIZE / 2
          const y = RADIUS + RADIUS * Math.sin(rad) - ICON_SIZE / 2
          return (
            <div
              key={icon.id}
              className="animate-orbit-ccw"
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: ICON_SIZE,
                height: ICON_SIZE,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={icon.src}
                alt={icon.alt}
                width={ICON_SIZE}
                height={ICON_SIZE}
                style={{ display: "block" }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
