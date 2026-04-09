# Mobile Dashboard Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the always-visible desktop sidebar with a responsive mobile layout (bottom tab bar + top header) on screens narrower than 1024px, while leaving the desktop layout completely unchanged.

**Architecture:** Three new client components (`MobileHeader`, `BottomTabBar`, `MobileMoreSheet` — the last is internal to `BottomTabBar`) are added to the dashboard layout. The sidebar gets `hidden lg:flex` so it vanishes below the `lg` breakpoint. The `<main>` element gets `lg:ml-64` (not `ml-64`) and gains top/bottom padding to clear the fixed header and tab bar on mobile.

**Tech Stack:** Next.js (App Router), Tailwind CSS v4, Clerk (`@clerk/nextjs`), Lucide React, existing `WizardContext`

---

## File Map

| Action | Path |
|--------|------|
| Modify | `src/components/dashboard/Sidebar.tsx` |
| Modify | `src/app/dashboard/layout.tsx` |
| Create | `src/components/dashboard/MobileHeader.tsx` |
| Create | `src/components/dashboard/BottomTabBar.tsx` |

---

### Task 1: Hide Sidebar on Mobile

**Files:**
- Modify: `src/components/dashboard/Sidebar.tsx:36`

- [ ] **Step 1: Read the AGENTS.md note**

  Open `node_modules/next/dist/docs/` and skim the App Router layout guide before touching any layout file. This project uses a Next.js version that may differ from your training data.

- [ ] **Step 2: Add `hidden lg:flex` to the aside element**

  In `src/components/dashboard/Sidebar.tsx`, line 36, replace the `className` on `<aside>`:

  ```tsx
  // Before
  <aside className="fixed top-0 left-0 h-full w-64 flex flex-col bg-surface border-r border-border z-40">

  // After
  <aside className="fixed top-0 left-0 h-full w-64 hidden lg:flex flex-col bg-surface border-r border-border z-40">
  ```

- [ ] **Step 3: Verify in browser**

  ```bash
  cd birdbot-cloud && npm run dev
  ```

  Open `http://localhost:3000/dashboard`. In DevTools, switch to a 390px wide viewport (iPhone). The left sidebar should be completely gone. At 1280px it should reappear. No other change should be visible.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/dashboard/Sidebar.tsx
  git commit -m "feat(mobile): hide desktop sidebar below lg breakpoint"
  ```

---

### Task 2: Create MobileHeader

**Files:**
- Create: `src/components/dashboard/MobileHeader.tsx`

The header is `h-14` (56px), fixed at the top, `lg:hidden`. Left side shows the active agent's name + status (tapping opens SettingsModal). Right side shows a profile avatar that toggles a dropdown with BirdBot Settings, Manage Account, and Sign Out.

- [ ] **Step 1: Create the file**

  Create `src/components/dashboard/MobileHeader.tsx` with this content:

  ```tsx
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
  ```

- [ ] **Step 2: Verify no TypeScript errors**

  ```bash
  cd birdbot-cloud && npx tsc --noEmit
  ```

  Expected: no errors related to `MobileHeader.tsx`.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/dashboard/MobileHeader.tsx
  git commit -m "feat(mobile): add MobileHeader with agent status and profile dropdown"
  ```

---

### Task 3: Create BottomTabBar

**Files:**
- Create: `src/components/dashboard/BottomTabBar.tsx`

Contains both the fixed tab bar and the "More" bottom sheet (internal). Four primary tabs (Chat, Integrations, Usage, Plan) + a "More" tab that slides up a sheet with the remaining items (AI Models, Skills, Support, Set Up AI Credits, Refer & Earn).

- [ ] **Step 1: Create the file**

  Create `src/components/dashboard/BottomTabBar.tsx` with this content:

  ```tsx
  "use client"

  import Link from "next/link"
  import { usePathname } from "next/navigation"
  import {
    MessageSquare, Plug, BarChart2, CreditCard,
    MoreHorizontal, Cpu, Wrench, LifeBuoy, Coins, Gift, X,
  } from "lucide-react"
  import { useState } from "react"
  import { Badge } from "@/components/ui/Badge"

  const primaryTabs = [
    { label: "Chat",         href: "/dashboard/chat",         icon: MessageSquare },
    { label: "Integrations", href: "/dashboard/integrations", icon: Plug },
    { label: "Usage",        href: "/dashboard/usage",        icon: BarChart2 },
    { label: "Plan",         href: "/dashboard/plan",         icon: CreditCard },
  ]

  const moreItems = [
    { label: "AI Models",         href: "/dashboard/models",  icon: Cpu,      iconColor: "" },
    { label: "Skills",            href: "/dashboard/skills",  icon: Wrench,   iconColor: "" },
    { label: "Support",           href: "/dashboard/support", icon: LifeBuoy, iconColor: "" },
    { label: "Set Up AI Credits", href: "/dashboard/models",  icon: Coins,    iconColor: "text-gold" },
    { label: "Refer & Earn",      href: "#",                  icon: Gift,     iconColor: "text-blue-bright", badge: "NEW" },
  ] as const

  export function BottomTabBar() {
    const pathname = usePathname()
    const [sheetOpen, setSheetOpen] = useState(false)

    const moreActive = moreItems.some(
      ({ href, label }) =>
        label !== "Refer & Earn" &&
        (pathname === href || pathname.startsWith(href + "/")),
    )

    return (
      <>
        {/* Sheet backdrop */}
        {sheetOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setSheetOpen(false)}
          />
        )}

        {/* More sheet */}
        {sheetOpen && (
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-surface border-t border-border px-4 pt-4"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-text-muted font-sans uppercase tracking-wide">
                More
              </span>
              <button
                onClick={() => setSheetOpen(false)}
                className="text-text-muted hover:text-text-base transition-colors"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-0.5 pb-2">
              {moreItems.map(({ label, href, icon: Icon, iconColor, badge }) => {
                const active = pathname === href || pathname.startsWith(href + "/")
                return (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setSheetOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-sans transition-all ${
                      active
                        ? "bg-blue/10 text-blue-bright border border-blue/20"
                        : "text-text-dim hover:text-text-base hover:bg-panel"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={active ? "text-blue-bright" : (iconColor || "text-text-muted")}
                    />
                    <span className="flex-1">{label}</span>
                    {badge && (
                      <Badge variant="blue" className="text-[10px] px-1.5 py-0">
                        {badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Fixed bottom tab bar */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border flex items-stretch"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Mobile navigation"
        >
          {primaryTabs.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-sans transition-colors ${
                  active ? "text-blue-bright" : "text-text-muted hover:text-text-dim"
                }`}
              >
                <Icon size={20} className={active ? "text-blue-bright" : "text-text-muted"} />
                {label}
              </Link>
            )
          })}
          <button
            onClick={() => setSheetOpen((v) => !v)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-sans transition-colors ${
              moreActive ? "text-blue-bright" : "text-text-muted hover:text-text-dim"
            }`}
            aria-label="More navigation options"
          >
            <MoreHorizontal size={20} className={moreActive ? "text-blue-bright" : "text-text-muted"} />
            More
          </button>
        </nav>
      </>
    )
  }
  ```

- [ ] **Step 2: Verify no TypeScript errors**

  ```bash
  cd birdbot-cloud && npx tsc --noEmit
  ```

  Expected: no errors related to `BottomTabBar.tsx`.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/dashboard/BottomTabBar.tsx
  git commit -m "feat(mobile): add BottomTabBar with More sheet"
  ```

---

### Task 4: Wire Mobile Components into Layout

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

Two changes: (1) add `MobileHeader` and `BottomTabBar` imports + render them, (2) fix `<main>` margins and padding so content is not hidden behind the fixed mobile header/tab bar.

- [ ] **Step 1: Replace layout.tsx**

  Replace the entire contents of `src/app/dashboard/layout.tsx` with:

  ```tsx
  import { Sidebar } from "@/components/dashboard/Sidebar"
  import { MobileHeader } from "@/components/dashboard/MobileHeader"
  import { BottomTabBar } from "@/components/dashboard/BottomTabBar"
  import { AgentSetupWizard } from "@/components/dashboard/AgentSetupWizard"
  import { SettingsModal } from "@/components/dashboard/SettingsModal"
  import { AccountModal } from "@/components/dashboard/AccountModal"
  import { WizardProvider } from "@/components/dashboard/WizardContext"
  import { IncubatingGate } from "@/components/dashboard/IncubatingGate"

  export default function DashboardLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <WizardProvider>
        <div className="min-h-screen bg-depth flex">
          <Sidebar />
          <MobileHeader />
          <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0 pb-16 lg:pb-0">
            <IncubatingGate>{children}</IncubatingGate>
          </main>
          <BottomTabBar />
          <AgentSetupWizard />
          <SettingsModal />
          <AccountModal />
        </div>
      </WizardProvider>
    )
  }
  ```

  Key changes vs. original:
  - `ml-64` → `lg:ml-64` (removes sidebar offset on mobile)
  - `pt-14 lg:pt-0` — clears the 56px `MobileHeader` on mobile
  - `pb-16 lg:pb-0` — clears the ~64px `BottomTabBar` on mobile
  - `<MobileHeader />` and `<BottomTabBar />` added (both self-hide at `lg+` via `lg:hidden`)

- [ ] **Step 2: Build check**

  ```bash
  cd birdbot-cloud && npm run build
  ```

  Expected: build completes with no errors. Warnings about `img` vs `Image` are OK.

- [ ] **Step 3: Manual smoke test — mobile**

  ```bash
  npm run dev
  ```

  Open `http://localhost:3000/dashboard`. In DevTools:

  1. **390px (iPhone):** Sidebar hidden. Top header visible with agent name + avatar. Incubating screen fills the screen between header and tab bar. Bottom tab bar shows Chat / Integrations / Usage / Plan / More. Tapping More slides up a sheet. Tapping avatar opens profile dropdown downward.
  2. **768px (iPad portrait):** Same mobile layout — no sidebar.
  3. **1280px (desktop):** Sidebar visible. No mobile header or tab bar visible.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/dashboard/layout.tsx
  git commit -m "feat(mobile): wire MobileHeader and BottomTabBar into dashboard layout"
  ```
