"use client"

import { useRef, useState, useEffect } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { LogOut, Settings, User } from "lucide-react"
import { useWizard } from "@/components/dashboard/WizardContext"

export function UserMenu() {
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const { setSettingsOpen } = useWizard()
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
    <div ref={menuRef} className="relative">
      {/* Floating dropdown */}
      {open && (
        <div
          className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-border overflow-hidden z-50"
          style={{
            background: "#141a2c",
            boxShadow: "0 0 0 1px rgba(37,99,235,0.12), 0 -8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header row — non-interactive */}
          <div className="flex items-center gap-2.5 px-3 py-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#2563eb,#60a5fa)" }}
            >
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-text-base font-sans truncate">{fullName}</span>
              <span className="text-[11px] text-text-muted font-sans truncate">{email}</span>
            </div>
          </div>

          <div className="h-px bg-border mx-2" />

          {/* BirdBot Settings */}
          <button
            type="button"
            onClick={() => { setOpen(false); setSettingsOpen(true) }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-sans text-text-dim hover:text-text-base hover:bg-panel transition-colors text-left"
          >
            <Settings size={14} className="text-text-muted flex-shrink-0" />
            BirdBot Settings
          </button>

          {/* Manage Account */}
          <button
            type="button"
            onClick={() => { setOpen(false); openUserProfile() }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-sans text-text-dim hover:text-text-base hover:bg-panel transition-colors text-left"
          >
            <User size={14} className="text-text-muted flex-shrink-0" />
            Manage Account
          </button>

          <div className="h-px bg-border mx-2" />

          {/* Sign Out */}
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-sans text-text-dim hover:text-text-base hover:bg-panel transition-colors text-left"
          >
            <LogOut size={14} className="text-text-muted flex-shrink-0" />
            Sign Out
          </button>
        </div>
      )}

      {/* Trigger card */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-panel border transition-all text-left"
        style={{
          borderColor: open ? "rgba(37,99,235,0.35)" : "var(--color-border)",
          boxShadow: open ? "0 0 12px rgba(37,99,235,0.1)" : "none",
        }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#2563eb,#60a5fa)" }}
        >
          {initials}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-semibold text-text-base font-sans truncate">
            {user?.firstName ?? user?.username ?? "User"}
          </span>
          <span className="text-xs text-text-muted font-sans truncate">{email}</span>
        </div>
        <span className="text-text-muted text-[10px] flex-shrink-0">{open ? "▲" : "▼"}</span>
      </button>
    </div>
  )
}
