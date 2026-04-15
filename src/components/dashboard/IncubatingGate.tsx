"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useWizard } from "./WizardContext"

function statusMessage(agentStatus: string | undefined): string {
  switch (agentStatus) {
    case "provisioning": return "Your Bird is hatching…"
    case "error":        return "Something went wrong during provisioning."
    default:             return "We'll let you know when your BirdBot has hatched."
  }
}

function statusSubline(agentStatus: string | undefined): string | null {
  switch (agentStatus) {
    case "provisioning": return "Spinning up your server and starting the container. This takes 2–4 minutes."
    case "error":        return "You can retry from the Edit BirdBot screen, or contact support."
    default:             return null
  }
}

export function IncubatingGate({ children }: { children: React.ReactNode }) {
  const { agents, onboarded, agentsLoaded, setSettingsOpen, refreshAgents } = useWizard()
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(false)

  const agent = agents[0]
  const agentStatus = agent?.status
  const isTransitioning = agentStatus === "incubating" || agentStatus === "provisioning"

  // Poll every 5s while provisioning so the gate lifts automatically when active
  useEffect(() => {
    if (!isTransitioning) return
    const id = setInterval(refreshAgents, 5000)
    return () => clearInterval(id)
  }, [isTransitioning, refreshAgents])

  if (!agentsLoaded) return null
  if (!onboarded) return <>{children}</>
  if (pathname === "/dashboard/account") return <>{children}</>
  if (dismissed) return <>{children}</>

  // Auto-lift: agent is fully provisioned
  if (agentStatus === "active") return <>{children}</>

  const agentName = agent?.name
  const isError = agentStatus === "error"

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

      <span className={`text-5xl select-none ${isTransitioning ? "animate-float" : ""}`}>
        {isError ? "⚠️" : "🥚"}
      </span>

      <div>
        <h2 className="font-heading font-black text-2xl text-text-base mb-2">
          {isError ? "Provisioning failed" : "Your BirdBot is incubating"}
        </h2>
        <p className="text-text-dim font-sans text-sm max-w-sm">
          {agentName && !isError ? (
            <>
              {statusMessage(agentStatus).replace("your BirdBot", agentName)}
            </>
          ) : (
            statusMessage(agentStatus)
          )}
        </p>
        {statusSubline(agentStatus) && (
          <p className="text-text-muted font-sans text-xs max-w-xs mx-auto mt-2">
            {statusSubline(agentStatus)}
          </p>
        )}
      </div>

      {/* Progress indicator while provisioning */}
      {isTransitioning && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue/10 border border-blue/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-bright animate-pulse" />
          <span className="text-xs font-semibold font-sans text-blue-bright">
            {agentStatus === "provisioning" ? "Provisioning" : "Starting up"}
          </span>
        </div>
      )}

      {!isTransitioning && !isError && (
        <div className="px-5 py-4 rounded-xl bg-gold/8 border border-gold/20 text-center max-w-sm w-full">
          <p className="text-xs font-bold text-gold mb-1.5">What happens next</p>
          <p className="text-xs text-text-muted font-sans leading-relaxed">
            We'll provision your agent and notify you at your registered email when it's ready to
            chat. You'll be able to access it from your dashboard once it's live.
          </p>
        </div>
      )}

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
