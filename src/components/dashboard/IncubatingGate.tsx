"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useWizard } from "./WizardContext"

export function IncubatingGate({ children }: { children: React.ReactNode }) {
  const { agents, onboarded, agentsLoaded, setSettingsOpen } = useWizard()
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(false)

  // Don't render anything while agents are loading — the wizard overlay handles the backdrop
  if (!agentsLoaded) return null

  // Not onboarded: wizard overlay handles them, show children underneath
  if (!onboarded) return <>{children}</>

  // Always allow the account page through
  if (pathname === '/dashboard/account') return <>{children}</>

  // User dismissed the gate — show dashboard
  if (dismissed) return <>{children}</>

  // Onboarded (deployed but bot not provisioned yet): show the incubating holding screen
  const agentName = agents[0]?.name

  return (
    <div className="fixed inset-0 lg:left-64 flex flex-col items-center justify-center gap-5 text-center px-7 pt-14 pb-16 lg:pt-0 lg:pb-0">
      <button
        onClick={() => setDismissed(true)}
        aria-label="Go to dashboard"
        className="absolute top-4 right-4 p-2 rounded-lg text-text-muted hover:text-text-base hover:bg-white/5 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <span className="text-5xl animate-float select-none">🥚</span>
      <div>
        <h2 className="font-heading font-black text-2xl text-text-base mb-2">
          Your BirdBot is incubating
        </h2>
        <p className="text-text-dim font-sans text-sm max-w-sm">
          {agentName ? (
            <>
              We'll let you know when{" "}
              <span className="text-text-base font-semibold">{agentName}</span> has hatched.
            </>
          ) : (
            "We'll let you know when your BirdBot has hatched."
          )}
        </p>
      </div>
      <div className="px-5 py-4 rounded-xl bg-gold/8 border border-gold/20 text-center max-w-sm w-full">
        <p className="text-xs font-bold text-gold mb-1.5">What happens next</p>
        <p className="text-xs text-text-muted font-sans leading-relaxed">
          We'll provision your agent and notify you at your registered email when it's ready to
          chat. You'll be able to access it from your dashboard once it's live.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setSettingsOpen(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold font-sans border border-border text-text-dim hover:text-text-base transition-colors"
        >
          Edit BirdBot
        </button>
        <a
          href="/"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold font-sans border border-border text-text-dim hover:text-text-base transition-colors"
        >
          Return to Home
        </a>
      </div>
    </div>
  )
}
