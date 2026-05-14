"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRef, useState, useEffect } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import Image from "next/image"
import { Brain, Link2, Building2, User, LogOut } from "lucide-react"
import { useWizard } from "@/components/onboarding/WizardContext"
import { ThemeToggle } from "@/components/dashboard/ThemeToggle"

const tabs = [
  { label: "HQ",           href: "/dashboard",              icon: Building2, exact: true  },
  { label: "Memory",       href: "/dashboard/memory",       icon: Brain,     exact: false },
  { label: "Integrations", href: "/dashboard/integrations", icon: Link2,     exact: false },
]

export function BottomTabBar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { setAccountOpen } = useWizard()
  const [profileOpen, setProfileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!profileOpen) return
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setProfileOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onMouseDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [profileOpen])

  const initials = (() => {
    const first = user?.firstName?.[0] ?? ""
    const last = user?.lastName?.[0] ?? ""
    if (first || last) return (first + last).toUpperCase()
    return (user?.username?.[0] ?? "U").toUpperCase()
  })()

  const fullName = user?.fullName ?? user?.username ?? "User"
  const email = user?.primaryEmailAddress?.emailAddress ?? ""

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-depth border-t flex items-stretch"
      style={{
        borderColor: "rgba(255,255,255,0.14)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-label="Mobile navigation"
    >
      {tabs.map(({ label, href, icon: Icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 text-[11px] font-sans transition-colors ${
              active ? "text-text-base" : "text-text-muted hover:text-text-dim"
            }`}
          >
            <Icon size={22} className={active ? "text-text-base" : "text-text-muted"} />
            {label}
          </Link>
        )
      })}

      {/* Profile tab */}
      <div ref={menuRef} className="flex-1 relative">
        {profileOpen && (
          <div
            role="menu"
            className="absolute bottom-full right-0 mb-2 w-52 rounded-xl border border-border overflow-hidden z-50"
            style={{
              background: "var(--theme-surface)",
              boxShadow: "0 0 0 1px var(--theme-border), 0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
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
                  style={{ background: "var(--theme-avatar-gradient)" }}
                >
                  {initials}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-text-base font-sans truncate">{fullName}</span>
                <span className="text-[11px] text-text-muted font-sans truncate">{email}</span>
              </div>
            </div>

            <div className="h-px bg-border mx-2" />

            <button
              type="button"
              role="menuitem"
              onClick={() => { setProfileOpen(false); setAccountOpen(true) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-sans text-text-dim hover:text-text-base hover:bg-panel transition-colors text-left"
            >
              <User size={14} className="flex-shrink-0" />
              Manage Account
            </button>

            <div className="h-px bg-border mx-2" />

            <ThemeToggle />

            <div className="h-px bg-border mx-2" />

            <button
              type="button"
              role="menuitem"
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
          onClick={() => setProfileOpen(v => !v)}
          aria-expanded={profileOpen}
          aria-haspopup="menu"
          aria-label="User menu"
          className={`w-full h-full flex flex-col items-center justify-center gap-1.5 py-2.5 text-[11px] font-sans transition-colors ${
            profileOpen ? "text-text-base" : "text-text-muted hover:text-text-dim"
          }`}
        >
          {user?.hasImage ? (
            <Image
              src={user.imageUrl}
              alt="Profile photo"
              width={22}
              height={22}
              className="w-[22px] h-[22px] rounded-full object-cover"
            />
          ) : (
            <div
              className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[9px] font-bold"
              style={{ background: "var(--theme-avatar-gradient)" }}
            >
              {initials}
            </div>
          )}
          Profile
        </button>
      </div>
    </nav>
  )
}
