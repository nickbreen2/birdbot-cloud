"use client"

import { useUser } from "@clerk/nextjs"
import { useWizard } from "./WizardContext"

export function IncubatingGate({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const { setForceOpen } = useWizard()

  // Don't render anything while Clerk loads — the wizard overlay handles the backdrop
  if (!isLoaded) return null

  // Not onboarded: wizard overlay handles them, show children underneath
  if (!user?.publicMetadata?.onboarded) return <>{children}</>

  // Onboarded (deployed but bot not provisioned yet): show the incubating holding screen
  const agentName = (user?.publicMetadata?.agent as { name?: string } | undefined)?.name

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-5 text-center px-7">
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
          onClick={() => setForceOpen(true)}
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
