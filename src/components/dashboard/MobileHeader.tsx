"use client"

import { useRef, useState, useEffect } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import Image from "next/image"
import { Settings, User, LogOut } from "lucide-react"
import { useWizard } from "@/components/dashboard/WizardContext"

export function MobileHeader() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { agents, agentsLoaded, setSettingsOpen, setAccountOpen } = useWizard()
  const activeAgent = agents[0] ?? null
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onMouseDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const initials = (() => {
    const first = user?.firstName?.[0] ?? ""
    const last = user?.lastName?.[0] ?? ""
    if (first || last) return (first + last).toUpperCase()
    return (user?.username?.[0] ?? "U").toUpperCase()
  })()

  const fullName = user?.fullName ?? user?.username ?? "User"
  const email = user?.primaryEmailAddress?.emailAddress ?? ""

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-surface border-b border-border">
      {/* Left: BirdBot instance */}
      {agentsLoaded && activeAgent ? (
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Open BirdBot settings"
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-panel border border-border hover:border-blue/40 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0">
            {activeAgent.status === "incubating" ? (
              <span className="text-sm leading-none">🥚</span>
            ) : (
              <img src="/BirdBot-Icon-mark2.svg" alt="" className="w-4 h-4" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold text-text-base font-sans uppercase tracking-wide truncate max-w-[120px]">
              {activeAgent.name}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    activeAgent.status === "active" || activeAgent.status === "online"
                      ? "bg-green-400"
                      : "bg-slate-500"
                  }`}
                />
                <span
                  className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                    activeAgent.status === "active" || activeAgent.status === "online"
                      ? "bg-green-400"
                      : "bg-slate-500"
                  }`}
                />
              </span>
              <p className="text-[10px] text-text-muted font-sans capitalize">
                {activeAgent.status}
              </p>
            </div>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-panel border border-border">
          <span className="w-2 h-2 rounded-full bg-border flex-shrink-0" />
          <span className="text-[11px] font-semibold text-text-dim font-sans uppercase tracking-wide">
            {agentsLoaded ? "No Bird" : "Loading…"}
          </span>
        </div>
      )}

      {/* Right: Profile avatar + dropdown */}
      <div ref={menuRef} className="relative">
        {open && (
          <div
            className="absolute top-full right-0 mt-2 w-52 rounded-xl border border-border overflow-hidden z-50"
            style={{
              background: "#141a2c",
              boxShadow: "0 0 0 1px rgba(37,99,235,0.12), 0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header row */}
            <div className="flex items-center gap-2.5 px-3 py-3">
              {user?.hasImage ? (
                <Image
                  src={user.imageUrl}
                  alt="Profile photo"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#2563eb,#60a5fa)" }}
                >
                  {initials}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-text-base font-sans truncate">
                  {fullName}
                </span>
                <span className="text-[11px] text-text-muted font-sans truncate">{email}</span>
              </div>
            </div>

            <div className="h-px bg-border mx-2" />

            <button
              type="button"
              onClick={() => { setOpen(false); setSettingsOpen(true) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-sans text-text-dim hover:text-text-base hover:bg-panel transition-colors text-left"
            >
              <Settings size={14} className="flex-shrink-0" />
              BirdBot Settings
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setAccountOpen(true) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-sans text-text-dim hover:text-text-base hover:bg-panel transition-colors text-left"
            >
              <User size={14} className="flex-shrink-0" />
              Manage Account
            </button>

            <div className="h-px bg-border mx-2" />

            <button
              type="button"
              onClick={() => signOut()}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-sans text-text-dim hover:text-text-base hover:bg-panel transition-colors text-left"
            >
              <LogOut size={14} className="flex-shrink-0" />
              Sign Out
            </button>
          </div>
        )}

        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="User menu"
        >
          {user?.hasImage ? (
            <Image
              src={user.imageUrl}
              alt="Profile photo"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "linear-gradient(135deg,#2563eb,#60a5fa)" }}
            >
              {initials}
            </div>
          )}
        </button>
      </div>
    </header>
  )
}
