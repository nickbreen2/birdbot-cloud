"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useAuth, SignOutButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/Button"

const NAV_LINKS = [
  { label: "How We Differ", href: "#how-we-differ" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [signInHover, setSignInHover] = useState(false)
  const [signOutHover, setSignOutHover] = useState(false)
  const { isLoaded, isSignedIn } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* ── Glass pill ── */}
      <div
        className="mx-4 mt-3 rounded-2xl border border-border px-4 sm:px-6 py-3 flex items-center justify-between max-w-full"
        style={{
          background: "rgba(10, 14, 26, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <Image
            src="/birdbot-full-logo-mark2.svg"
            alt="BirdBot"
            width={133}
            height={32}
            priority
            className="w-[108px] sm:w-[133px]"
            style={{ height: "auto" }}
          />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="text-sm text-text-dim hover:text-text-base transition-colors font-sans"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA — auth-aware */}
        {isLoaded && isSignedIn ? (
          <div className="hidden md:flex items-center gap-3">
            <SignOutButton>
              <button
                className="text-sm font-sans transition-colors"
                style={{ color: signOutHover ? "#f1f5f9" : "#94a3b8" }}
                onMouseEnter={() => setSignOutHover(true)}
                onMouseLeave={() => setSignOutHover(false)}
              >
                Sign out
              </button>
            </SignOutButton>
            <Link href="/dashboard">
              <button
                className="text-sm px-4 py-2 rounded-lg font-sans flex items-center gap-1.5 transition-colors hover:opacity-90"
                style={{
                  background: "#151c2e",
                  border: "1px solid #1e2a45",
                  color: "#f1f5f9",
                }}
              >
                Dashboard <span>→</span>
              </button>
            </Link>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-sans transition-colors"
              style={{ color: signInHover ? "#f1f5f9" : "#94a3b8" }}
              onMouseEnter={() => setSignInHover(true)}
              onMouseLeave={() => setSignInHover(false)}
            >
              Sign In
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        )}

        {/* Mobile hamburger — pushes to far right on mobile */}
        <button
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 flex-shrink-0"
          style={{
            color: "#ffffff",
            background: open ? "rgba(37,99,235,0.70)" : "rgba(37,99,235,0.35)",
            border: "1px solid rgba(59,130,246,0.55)",
          }}
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Mobile dropdown menu ── */}
      {open && (
        <div
          className="md:hidden mx-3 sm:mx-4 mt-1.5 rounded-2xl border border-border"
          style={{
            background: "rgba(10, 14, 26, 0.96)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <nav className="flex flex-col p-3 gap-0.5">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="text-sm text-text-dim hover:text-text-base transition-colors font-sans px-3 py-2.5 rounded-xl hover:bg-panel"
              >
                {label}
              </a>
            ))}
            <div className="mt-2 pt-2 border-t border-border px-1 flex flex-col gap-2">
              {isLoaded && isSignedIn ? (
                <>
                  <SignOutButton>
                    <button
                      className="w-full text-sm text-left px-3 py-2.5 rounded-xl font-sans transition-colors text-text-dim hover:text-text-base hover:bg-panel"
                      onClick={() => setOpen(false)}
                    >
                      Sign out
                    </button>
                  </SignOutButton>
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    <button
                      className="w-full text-sm px-3 py-2.5 rounded-xl font-sans flex items-center justify-between transition-colors hover:opacity-90"
                      style={{
                        background: "#151c2e",
                        border: "1px solid #1e2a45",
                        color: "#f1f5f9",
                      }}
                    >
                      Dashboard <span>→</span>
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/sign-in" onClick={() => setOpen(false)}>
                    <button className="w-full text-sm text-left px-3 py-2.5 rounded-xl font-sans transition-colors text-text-dim hover:text-text-base hover:bg-panel">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setOpen(false)}>
                    <Button size="sm" className="w-full justify-center">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
