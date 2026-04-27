import Link from "next/link"

const FOOTER_HREFS: Record<string, string> = {
  Privacy: "/privacy",
  Terms: "/terms",
  Support: "/support",
}

export function Footer() {
  return (
    <footer className="relative pb-8 pt-10">
      {/* Glowing top border */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.25) 20%, rgba(96,165,250,0.55) 50%, rgba(37,99,235,0.25) 80%, transparent 100%)",
        }}
      />
      {/* Subtle glow bloom behind the separator */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "min(480px, 100%)",
          height: "1px",
          boxShadow: "0 0 32px 8px rgba(59,130,246,0.12)",
        }}
      />

      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-6 px-8 sm:px-12">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group flex-shrink-0"
          aria-label="BirdBot home"
        >
          <span
            className="font-heading font-black leading-none select-none"
            style={{
              fontSize: "1.4rem",
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

        {/* Copyright */}
        <p
          className="text-sm font-sans order-last sm:order-none"
          style={{ color: "rgba(100,116,139,0.8)", letterSpacing: "0.01em" }}
        >
          © {new Date().getFullYear()} BirdBot.ai
        </p>

        {/* Links */}
        <nav className="flex items-center gap-1">
          {["Privacy", "Terms", "Support"].map((label, i) => (
            <span key={label} className="flex items-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className="mx-1"
                  style={{ color: "rgba(100,116,139,0.35)", fontSize: "0.6rem" }}
                >
                  ·
                </span>
              )}
              <a
                href={FOOTER_HREFS[label] ?? "#"}
                className="text-sm font-sans transition-colors duration-200 hover:text-blue-bright"
                style={{ color: "rgba(100,116,139,0.8)" }}
              >
                {label}
              </a>
            </span>
          ))}
        </nav>
      </div>
    </footer>
  )
}
