"use client"

import { useRef, useState, useEffect } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import Image from "next/image"
import { LogOut, User, ChevronDown } from "lucide-react"
import { useWizard } from "@/components/onboarding/WizardContext"
import { ThemeToggle } from "@/components/dashboard/ThemeToggle"

export function UserMenu() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { setAccountOpen } = useWizard()
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
      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50"
          style={{
            background: "var(--theme-surface)",
            border: "1px solid var(--theme-border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <button
            type="button"
            onClick={() => { setOpen(false); setAccountOpen(true) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-sans text-text-dim hover:text-text-base hover:bg-panel transition-colors text-left"
          >
            <User size={14} className="flex-shrink-0 text-text-muted" />
            Account settings
          </button>

          <div className="mx-3 h-px bg-border" />

          <ThemeToggle />

          <div className="mx-3 h-px bg-border" />

          <button
            type="button"
            onClick={() => signOut()}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-sans text-text-dim hover:text-text-base hover:bg-panel transition-colors text-left"
          >
            <LogOut size={14} className="flex-shrink-0 text-text-muted" />
            Sign out
          </button>
        </div>
      )}

      {/* Trigger — flat row, no card box */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
        className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-colors text-left hover:bg-panel-hover"
        style={{ background: open ? "var(--theme-panel-hover)" : undefined }}
      >
        {/* Avatar */}
        {user?.hasImage ? (
          <Image
            src={user.imageUrl}
            alt="Profile photo"
            width={34}
            height={34}
            className="w-[34px] h-[34px] rounded-full object-cover flex-shrink-0 ring-1 ring-white/10"
          />
        ) : (
          <div
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-1 ring-white/10"
            style={{ background: "var(--theme-avatar-gradient)" }}
          >
            {initials}
          </div>
        )}

        {/* Name + email */}
        <div className="flex flex-col min-w-0 flex-1 gap-[2px]">
          <span className="text-[13px] font-semibold text-text-base font-sans truncate leading-none">
            {user?.firstName ?? user?.username ?? "User"}
          </span>
          <span className="text-[11px] text-text-muted font-sans truncate leading-none">{email}</span>
        </div>

        {/* Chevron */}
        <ChevronDown
          size={14}
          className="flex-shrink-0 text-text-muted transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
    </div>
  )
}
