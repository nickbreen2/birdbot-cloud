import Link from "next/link"

export function AuthBrand() {
  return (
    <Link href="/">
      <span
        className="font-heading font-black leading-none select-none"
        style={{
          fontSize: "2.8rem",
          letterSpacing: "-0.035em",
          background: "linear-gradient(155deg, #ffffff 0%, #e0f2fe 25%, #bae6fd 48%, #93c5fd 72%, #60a5fa 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        BirdBot
      </span>
    </Link>
  )
}
