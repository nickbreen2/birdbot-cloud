import Image from "next/image"

interface AuthBrandProps {
  tagline: string
}

export function AuthBrand({ tagline }: AuthBrandProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <Image
        src="/BirdBot-Icon-mark1.svg"
        alt="BirdBot"
        width={48}
        height={48}
        priority
        style={{ height: "auto" }}
      />
      <span
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "20px",
          fontWeight: 700,
          letterSpacing: "0.04em",
          color: "#f1f5f9",
        }}
      >
        BirdBot
      </span>
      <span style={{ fontSize: "13px", color: "#64748b" }}>{tagline}</span>
    </div>
  )
}
