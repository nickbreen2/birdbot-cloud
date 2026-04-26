import Image from "next/image"

const CONTAINER = 280
const RADIUS = 105
const ICON_SIZE = 52
const DURATION = 30

const ICONS = [
  { id: "telegram",  src: "/Telegram.svg",  alt: "Telegram",  comingSoon: false, delay: 0   },
  { id: "imessage",  src: "/IMessage.svg",   alt: "iMessage",  comingSoon: true,  delay: -10 },
  { id: "whatsapp",  src: "/Whatsapp.svg",  alt: "WhatsApp",  comingSoon: true,  delay: -20 },
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
          width={96}
          height={96}
          unoptimized
          style={{
            filter:
              "drop-shadow(0 0 18px rgba(125,211,252,0.55)) drop-shadow(0 2px 8px rgba(37,99,235,0.40))",
          }}
        />
      </div>

      {/* Orbiting icons */}
      {ICONS.map((icon) => (
        <div
          key={icon.id}
          aria-label={icon.alt}
          className="animate-orbit-cw"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 0,
            height: 0,
            transformOrigin: "0 0",
            animationDelay: `${icon.delay}s`,
            zIndex: 3,
          }}
        >
          <div
            className="animate-orbit-ccw"
            style={{
              position: "absolute",
              left: RADIUS,
              top: -(ICON_SIZE / 2),
              animationDelay: `${icon.delay}s`,
            }}
          >
            <Image
              src={icon.src}
              alt={icon.alt}
              width={ICON_SIZE}
              height={ICON_SIZE}
              unoptimized
            />
          </div>
        </div>
      ))}
    </div>
  )
}
