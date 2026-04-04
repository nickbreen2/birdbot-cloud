# Custom User Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Clerk's default `<UserButton />` in the dashboard sidebar with a fully on-theme custom dropdown containing BirdBot Settings, Manage Account, and Sign Out.

**Architecture:** A new `UserMenu` client component owns all dropdown state and Clerk hook calls. `Sidebar.tsx` drops in `<UserMenu />` where the old user card was. The Clerk `UserProfile` panel (opened via `openUserProfile()`) is themed dark by adding an `appearance` prop to `<ClerkProvider>` in `layout.tsx`.

**Tech Stack:** Next.js 15 (App Router), React, `@clerk/nextjs` (`useUser`, `useClerk`), Tailwind CSS v4, Lucide icons, Vitest (build verification only — no DOM test environment configured)

**Spec:** `docs/superpowers/specs/2026-04-03-custom-user-menu-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/dashboard/UserMenu.tsx` | **Create** | Self-contained dropdown — trigger card, floating panel, all Clerk hook calls |
| `src/components/dashboard/Sidebar.tsx` | **Modify** | Swap `<UserButton />` + surrounding user card for `<UserMenu />` |
| `src/app/layout.tsx` | **Modify** | Add `appearance` prop to `<ClerkProvider>` to dark-theme the account panel |

---

## Task 1: Create `UserMenu` component

**Files:**
- Create: `src/components/dashboard/UserMenu.tsx`

- [ ] **Step 1: Create the file**

```tsx
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

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
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
            onClick={() => { setOpen(false); setSettingsOpen(true) }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-sans text-blue-bright hover:bg-blue/10 transition-colors text-left"
          >
            <Settings size={14} className="text-blue-bright flex-shrink-0" />
            BirdBot Settings
          </button>

          {/* Manage Account */}
          <button
            onClick={() => { setOpen(false); openUserProfile() }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-sans text-text-dim hover:text-text-base hover:bg-panel transition-colors text-left"
          >
            <User size={14} className="text-text-muted flex-shrink-0" />
            Manage Account
          </button>

          <div className="h-px bg-border mx-2" />

          {/* Sign Out */}
          <button
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
        onClick={() => setOpen((v) => !v)}
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
```

- [ ] **Step 2: Verify the build compiles**

```bash
cd birdbot-cloud && npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors referencing `UserMenu.tsx`. Build may show other pre-existing errors — only fail if errors point to this new file.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/UserMenu.tsx
git commit -m "feat: add UserMenu component with BirdBot-themed dropdown"
```

---

## Task 2: Wire `UserMenu` into `Sidebar`

**Files:**
- Modify: `src/components/dashboard/Sidebar.tsx`

- [ ] **Step 1: Update imports**

Replace the existing imports line:
```tsx
import { useUser, UserButton } from "@clerk/nextjs"
```
With:
```tsx
import { UserMenu } from "@/components/dashboard/UserMenu"
```

Also remove `useUser` from the hooks in the component body — `user` is no longer needed in `Sidebar` itself (it's now consumed inside `UserMenu`).

The destructured `useUser` call is on line 32:
```tsx
const { user } = useUser()
```
Delete that line entirely.

- [ ] **Step 2: Replace the user card block**

Find and replace the entire user profile block at the bottom of the sidebar (the `{/* User profile */}` comment and its `<div>`):

**Remove:**
```tsx
        {/* User profile */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl bg-panel border border-border">
          <UserButton />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-text-base font-sans truncate">
              {user?.firstName ?? user?.username ?? "User"}
            </span>
            <span className="text-xs text-text-muted font-sans truncate">
              {user?.primaryEmailAddress?.emailAddress ?? ""}
            </span>
          </div>
        </div>
```

**Replace with:**
```tsx
        {/* User menu */}
        <UserMenu />
```

- [ ] **Step 3: Verify build**

```bash
cd birdbot-cloud && npm run build 2>&1 | tail -20
```

Expected: no errors in `Sidebar.tsx` or `UserMenu.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/Sidebar.tsx
git commit -m "feat: replace UserButton with custom UserMenu in sidebar"
```

---

## Task 3: Dark-theme the Clerk account panel

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add `appearance` prop to `<ClerkProvider>`**

Find:
```tsx
        <ClerkProvider>
```

Replace with:
```tsx
        <ClerkProvider
          appearance={{
            variables: {
              colorBackground: "#141a2c",
              colorInputBackground: "#0e1425",
              colorInputText: "#f1f5f9",
              colorText: "#f1f5f9",
              colorTextSecondary: "#94a3b8",
              colorPrimary: "#2563eb",
              colorDanger: "#ef4444",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-dm-sans)",
            },
          }}
        >
```

- [ ] **Step 2: Verify build**

```bash
cd birdbot-cloud && npm run build 2>&1 | tail -20
```

Expected: clean build, no errors in `layout.tsx`.

- [ ] **Step 3: Smoke-test in the browser**

Start the dev server:
```bash
cd birdbot-cloud && npm run dev
```

Check:
1. Bottom of the sidebar shows a blue-gradient avatar circle with your initials instead of Clerk's white circle
2. Clicking the card opens a dark dropdown above it with BirdBot Settings / Manage Account / Sign Out
3. Clicking outside the dropdown closes it
4. Pressing Escape closes it
5. "BirdBot Settings" opens the existing BirdBot settings modal
6. "Manage Account" opens the Clerk account panel with a dark background (not white)
7. "Sign Out" signs you out

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: apply dark theme to Clerk account panel via appearance API"
```
