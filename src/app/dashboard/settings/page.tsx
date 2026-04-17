"use client"

import { useUser, useClerk } from "@clerk/nextjs"
import Image from "next/image"
import { LogOut } from "lucide-react"

export default function SettingsPage() {
  const { user } = useUser()
  const { signOut } = useClerk()

  const fullName = user?.fullName ?? user?.username ?? "—"
  const email = user?.primaryEmailAddress?.emailAddress ?? "—"
  const initials = (() => {
    const first = user?.firstName?.[0] ?? ""
    const last = user?.lastName?.[0] ?? ""
    if (first || last) return (first + last).toUpperCase()
    return (user?.username?.[0] ?? "U").toUpperCase()
  })()

  return (
    <div className="p-6 md:p-8 max-w-xl">
      <h1 className="font-heading font-bold text-2xl text-text-base mb-8">Settings</h1>

      {/* Account */}
      <section className="mb-8">
        <h2 className="text-[11px] font-bold font-sans text-text-muted uppercase tracking-widest mb-4">Account</h2>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-panel border border-border mb-3">
          {user?.hasImage ? (
            <Image
              src={user.imageUrl}
              alt="Profile photo"
              width={44}
              height={44}
              className="w-11 h-11 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#2563eb,#60a5fa)" }}
            >
              {initials}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-text-base font-sans">{fullName}</span>
            <span className="text-xs text-text-muted font-sans truncate">{email}</span>
          </div>
        </div>
        <p className="text-xs text-text-muted font-sans">
          To update your name or email, use your Clerk account portal via the user menu.
        </p>
      </section>

      {/* API key */}
      <section className="mb-8">
        <h2 className="text-[11px] font-bold font-sans text-text-muted uppercase tracking-widest mb-4">Anthropic API Key</h2>
        <div className="p-4 rounded-xl bg-panel border border-border">
          <p className="text-sm text-text-dim font-sans leading-relaxed">
            Your API key is stored in your local MCP config file — BirdBot never stores it in the cloud. To update it, edit the <span className="font-mono text-text-base">ANTHROPIC_API_KEY</span> field in your tool's MCP config.
          </p>
        </div>
      </section>

      {/* Sign out */}
      <section>
        <h2 className="text-[11px] font-bold font-sans text-text-muted uppercase tracking-widest mb-4">Session</h2>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold font-sans border border-border text-text-dim hover:text-text-base hover:border-border/60 transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </section>
    </div>
  )
}
