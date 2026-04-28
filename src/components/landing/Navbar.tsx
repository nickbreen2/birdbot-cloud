"use client"

import Link from "next/link"
import { useState, useCallback, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth, SignOutButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/Button"
import { AuthModal } from "@/components/auth/AuthModal"

const NAV_LINKS = [
  { label: "Features", id: "use-cases" },
  { label: "How It Works", id: "how-it-works" },
  { label: "FAQ", id: "faq" },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [signOutHover, setSignOutHover] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const { isLoaded, isSignedIn } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // When we navigate to "/" from a sub-page, pick up the pending scroll target
  useEffect(() => {
    if (pathname === '/') {
      const target = sessionStorage.getItem('pendingScroll')
      if (target) {
        sessionStorage.removeItem('pendingScroll')
        setTimeout(() => {
          document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })
        }, 150)
      }
    }
  }, [pathname])

  function handleNavClick(id: string) {
    if (pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      sessionStorage.setItem('pendingScroll', id)
      router.push('/')
    }
  }

  const openModal = useCallback((mode: 'sign-in' | 'sign-up') => {
    setModalMode(mode)
    setModalOpen(true)
    setOpen(false)
  }, [])

  const closeModal = useCallback(() => setModalOpen(false), [])

  const switchMode = useCallback((mode: 'sign-in' | 'sign-up') => {
    setModalMode(mode)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* ── Navbar bar ── */}
      <div
        className="relative px-4 sm:px-6 py-4 flex items-center justify-between"
        style={{
          background: "rgba(10,14,26,0.72)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.28)",
        }}
      >
        {/* Glowing bottom border line */}
        <div
          aria-hidden
          className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.25) 20%, rgba(96,165,250,0.55) 50%, rgba(37,99,235,0.25) 80%, transparent 100%)",
          }}
        />
        {/* Glow bloom behind the line */}
        <div
          aria-hidden
          className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: "min(480px, 100%)",
            height: "1px",
            boxShadow: "0 0 32px 8px rgba(59,130,246,0.12)",
          }}
        />
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <span
            className="font-heading font-black leading-none select-none"
            style={{
              fontSize: "clamp(1.65rem, 3.5vw, 2rem)",
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

        {/* Desktop nav links — absolutely centered so logo/CTA width doesn't shift them */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-7">
          {NAV_LINKS.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className="text-sm text-text-dim hover:text-text-base transition-colors font-sans"
            >
              {label}
            </button>
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
            <button
              onClick={() => openModal('sign-in')}
              className="text-sm font-sans transition-colors"
              style={{ color: "#94a3b8" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
            >
              Sign In
            </button>
            <Button size="sm" onClick={() => openModal('sign-up')}>
              Get Started
            </Button>
          </div>
        )}

        {/* Mobile / tablet hamburger */}
        <button
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 flex-shrink-0"
          style={{
            color: "#ffffff",
            background: open ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: open
              ? "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.25)"
              : "inset 0 1px 0 rgba(255,255,255,0.08)",
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

      {/* ── Mobile / tablet dropdown menu ── */}
      {open && (
        <div
          className="md:hidden border-b"
          style={{
            background: "rgba(10,14,26,0.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottomColor: "rgba(59,130,246,0.18)",
          }}
        >
          <nav className="flex flex-col p-3 gap-0.5">
            {NAV_LINKS.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => { handleNavClick(id); setOpen(false) }}
                className="text-sm text-text-dim hover:text-text-base transition-colors font-sans px-3 py-2.5 rounded-xl hover:bg-panel text-left"
              >
                {label}
              </button>
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
                  <button
                    onClick={() => openModal('sign-in')}
                    className="w-full text-sm text-center px-3 py-2.5 rounded-xl font-sans transition-colors text-text-dim hover:text-text-base hover:bg-panel border border-border"
                  >
                    Sign In
                  </button>
                  <Button size="md" className="w-full justify-center" onClick={() => openModal('sign-up')}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* ── Auth Modal ── */}
      {modalOpen && (
        <AuthModal
          mode={modalMode}
          onClose={closeModal}
          onSwitchMode={switchMode}
        />
      )}
    </header>
  )
}
