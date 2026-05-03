# Theme Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Light / Dark / System theme switching to the BirdBot.ai dashboard with a segmented pill toggle in the profile dropdown on both desktop and mobile.

**Architecture:** Two-tier CSS variable system — `--theme-*` vars flip between light/dark values based on `[data-theme]` on `<html>`, while existing Tailwind `--color-*` vars point to `var(--theme-*)` so all current utility classes keep working. `next-themes` handles SSR-safe theme persistence and system preference detection.

**Tech Stack:** next-themes ^0.4, Tailwind v4 (@theme inline + @custom-variant), React 19, Next.js 16 App Router, Lucide icons (Sun, Moon, Monitor)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Add next-themes dependency |
| `src/app/globals.css` | Modify | Two-tier CSS variable system, @custom-variant dark |
| `src/app/custom.css` | Modify | Light-mode overrides for all hardcoded dark hex |
| `src/app/layout.tsx` | Modify | Wrap with ThemeProviderWrapper, move suppressHydrationWarning to html |
| `src/components/ThemeProviderWrapper.tsx` | Create | Client component wrapper for next-themes ThemeProvider |
| `src/components/dashboard/ThemeToggle.tsx` | Create | Segmented pill toggle (Light / Dark / System) |
| `src/components/dashboard/UserMenu.tsx` | Modify | Add ThemeToggle, replace hardcoded hex with CSS vars |
| `src/components/dashboard/BottomTabBar.tsx` | Modify | Add ThemeToggle, replace hardcoded hex with CSS vars |
| `src/components/StarField.tsx` | Modify | Add `starfield` CSS class so custom.css can target it |
| `src/components/memory/GraphView.tsx` | Modify | Read CSS vars for D3 colors, add MutationObserver for theme recolor |
| `src/components/memory/GraphCanvas.tsx` | Modify | CSS var for MiniMap edge stroke |

---

## Task 1: Install next-themes

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
cd birdbot-cloud && npm install next-themes@^0.4
```

Expected output: `added 1 package` (or similar), no errors.

- [ ] **Step 2: Verify install**

```bash
cat node_modules/next-themes/package.json | grep '"version"'
```

Expected: `"version": "0.4.x"` or higher.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
```

```bash
git commit -m "chore: install next-themes for theme switching"
```

---

## Task 2: Restructure globals.css — two-tier CSS variable system

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace the entire contents of globals.css**

The file currently has 25 lines. Replace it entirely with:

```css
@import "tailwindcss";

/* ── Light theme (default / :root) ── */
:root {
  --theme-depth:        #f8fafc;
  --theme-surface:      #f1f5f9;
  --theme-panel:        #ffffff;
  --theme-panel-hover:  #f8fafc;
  --theme-border:       #e2e8f0;
  --theme-text-base:    #0f172a;
  --theme-text-dim:     #475569;
  --theme-text-muted:   #94a3b8;
  /* Theme toggle pill */
  --theme-toggle-track:        #e2e8f0;
  --theme-toggle-active:       #0f172a;
  --theme-toggle-text:         #94a3b8;
  --theme-toggle-text-active:  #ffffff;
  /* Avatar fallback gradient */
  --theme-avatar-gradient: linear-gradient(135deg, #cbd5e1, #94a3b8);
  /* Graph D3 colors */
  --graph-edge-base:  rgba(0, 0, 0, 0.1);
  --graph-edge-hi:    rgba(0, 0, 0, 0.3);
  --graph-edge-lo:    rgba(0, 0, 0, 0.03);
  --graph-label:      #64748b;
  --graph-label-hi:   #0f172a;
  --graph-label-lo:   #e2e8f0;
  --graph-minimap-edge: rgba(0, 0, 0, 0.1);
}

/* ── Dark theme ── */
[data-theme="dark"] {
  --theme-depth:        #000000;
  --theme-surface:      #111111;
  --theme-panel:        #1a1a1a;
  --theme-panel-hover:  #222222;
  --theme-border:       #3d3d3d;
  --theme-text-base:    #f1f5f9;
  --theme-text-dim:     #94a3b8;
  --theme-text-muted:   #64748b;
  --theme-toggle-track:        #222222;
  --theme-toggle-active:       #ffffff;
  --theme-toggle-text:         #64748b;
  --theme-toggle-text-active:  #0f172a;
  --theme-avatar-gradient: linear-gradient(135deg, #2a2a2a, #444444);
  --graph-edge-base:  rgba(148, 163, 184, 0.18);
  --graph-edge-hi:    rgba(148, 163, 184, 0.5);
  --graph-edge-lo:    rgba(148, 163, 184, 0.04);
  --graph-label:      #a1a1aa;
  --graph-label-hi:   #e4e4e7;
  --graph-label-lo:   #27272a;
  --graph-minimap-edge: rgba(255, 255, 255, 0.07);
}

@theme inline {
  /* ── BirdBot color palette (theme-responsive) ── */
  --color-depth:        var(--theme-depth);
  --color-surface:      var(--theme-surface);
  --color-panel:        var(--theme-panel);
  --color-panel-hover:  var(--theme-panel-hover);
  --color-border:       var(--theme-border);
  --color-text-base:    var(--theme-text-base);
  --color-text-dim:     var(--theme-text-dim);
  --color-text-muted:   var(--theme-text-muted);

  /* ── Accents (theme-invariant) ── */
  --color-blue:         #2563eb;
  --color-blue-light:   #3b82f6;
  --color-blue-bright:  #60a5fa;
  --color-gold:         #eab308;
  --color-gold-light:   #facc15;
  --color-emerald:      #22c55e;

  /* ── Typography ── */
  --font-heading: var(--font-outfit);
  --font-sans:    var(--font-outfit);
}

/* ── Tailwind dark variant (for one-off dark: prefix utilities) ── */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

- [ ] **Step 2: Verify dev server starts without errors**

```bash
npm run dev
```

Open `http://localhost:3000/dashboard`. The dashboard should look identical to before (system default is dark for most users; if your OS is light mode you'll see a white dashboard — that's correct). No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
```

```bash
git commit -m "refactor: two-tier CSS variable system for theme switching"
```

---

## Task 3: Update custom.css — light mode overrides

**Files:**
- Modify: `src/app/custom.css`

- [ ] **Step 1: Update the `html, body` rule (lines 4-9)**

Find:
```css
html, body {
  background-color: #0a0e1a;
  color: #f1f5f9;
  overflow-x: hidden;
  scroll-behavior: smooth;
}
```

Replace with:
```css
html, body {
  background-color: var(--theme-depth);
  color: var(--theme-text-base);
  overflow-x: hidden;
  scroll-behavior: smooth;
}
```

- [ ] **Step 2: Update the scrollbar rules (find `::-webkit-scrollbar` block)**

Find:
```css
/* scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0a0e1a; }
::-webkit-scrollbar-thumb { background: #1e2a45; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #2563eb; }
```

Replace with:
```css
/* scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--theme-depth); }
::-webkit-scrollbar-thumb { background: var(--theme-border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #2563eb; }
```

- [ ] **Step 3: Update `.gc` (graph canvas chrome) — replace hardcoded dark hex with CSS vars**

Find:
```css
.gc {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 720px;
  border: 1px solid #1A1A1E;
  border-radius: 14px;
  background: rgba(8, 8, 11, 0.6);
  overflow: hidden;
  font-family: var(--font-outfit), -apple-system, sans-serif;
}
```

Replace with:
```css
.gc {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 720px;
  border: 1px solid var(--gc-border);
  border-radius: 14px;
  background: var(--gc-bg);
  overflow: hidden;
  font-family: var(--font-outfit), -apple-system, sans-serif;
}
```

- [ ] **Step 4: Update `.gc::before` dot pattern**

Find:
```css
.gc::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    circle at 1px 1px,
    rgba(255, 255, 255, 0.04) 1px,
    transparent 0
  );
  background-size: 24px 24px;
  opacity: 0.4;
  pointer-events: none;
}
```

Replace with:
```css
.gc::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    circle at 1px 1px,
    var(--gc-bg-dot) 1px,
    transparent 0
  );
  background-size: 24px 24px;
  opacity: 0.4;
  pointer-events: none;
}
```

- [ ] **Step 5: Update `.gc__overview`**

Find:
```css
.gc__overview {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 2;
  padding: 6px;
  background: rgba(11, 11, 14, 0.85);
  border: 1px solid #232328;
  border-radius: 8px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

Replace with:
```css
.gc__overview {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 2;
  padding: 6px;
  background: var(--gc-overlay);
  border: 1px solid var(--gc-overlay-border);
  border-radius: 8px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

- [ ] **Step 6: Update `.gc__overview-label`**

Find:
```css
.gc__overview-label {
  padding: 0 4px 4px;
  font-family: var(--font-jetbrains), ui-monospace, monospace;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: #7A7A82;
}
```

Replace with:
```css
.gc__overview-label {
  padding: 0 4px 4px;
  font-family: var(--font-jetbrains), ui-monospace, monospace;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--gc-label-color);
}
```

- [ ] **Step 7: Update `.gc__zoom`**

Find:
```css
.gc__zoom {
  position: absolute;
  bottom: 14px;
  right: 14px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  background: rgba(11, 11, 14, 0.85);
  border: 1px solid #232328;
  border-radius: 8px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow: hidden;
}
```

Replace with:
```css
.gc__zoom {
  position: absolute;
  bottom: 14px;
  right: 14px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  background: var(--gc-overlay);
  border: 1px solid var(--gc-overlay-border);
  border-radius: 8px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow: hidden;
}
```

- [ ] **Step 8: Update `.gc__zoom button` rules**

Find:
```css
.gc__zoom button {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 0;
  color: #C8C8CE;
  cursor: pointer;
  font-family: var(--font-jetbrains), ui-monospace, monospace;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  transition: background 0.15s, color 0.15s;
}

.gc__zoom button:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}

.gc__zoom button + button {
  border-top: 1px solid #232328;
}
```

Replace with:
```css
.gc__zoom button {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 0;
  color: var(--gc-btn-text);
  cursor: pointer;
  font-family: var(--font-jetbrains), ui-monospace, monospace;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  transition: background 0.15s, color 0.15s;
}

.gc__zoom button:hover {
  background: var(--gc-btn-hover);
  color: var(--gc-btn-hover-text);
}

.gc__zoom button + button {
  border-top: 1px solid var(--gc-divider);
}
```

- [ ] **Step 9: Add `.brief` light-mode overrides block**

The `.brief` section defines dark-valued CSS variables. These need light overrides. Append this block **after** the existing `.brief { ... }` rule block (after the last rule that mentions `--brief-*` vars):

```css
/* ── Brief: light mode overrides ── */
[data-theme="light"] .brief {
  --brief-bg:             #f8fafc;
  --brief-surface:        linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  --brief-border:         #e2e8f0;
  --brief-border-hover:   #cbd5e1;
  --brief-text-primary:   #0f172a;
  --brief-text-body:      #334155;
  --brief-text-muted:     #475569;
  --brief-text-faint:     #94a3b8;
  --brief-text-faintest:  #cbd5e1;
  --brief-accent:         #2563eb;
  --brief-status-on:      #16a34a;
}
```

- [ ] **Step 10: Add memory timeline light overrides**

Append after the last `.mem-*` rule:

```css
/* ── Memory timeline: light mode overrides ── */
[data-theme="light"] {
  .mem-group__title { color: #1e293b; }
  .mem-group__sub   { color: #94a3b8; }
  .mem-group__count { color: #94a3b8; }
  .mem-group__rule  { background: linear-gradient(90deg, rgba(0,0,0,0.06) 0%, transparent 100%); }

  .mem-card {
    background: #ffffff;
    border-color: #e2e8f0;
  }
  .mem-card:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .mem-card__time  { color: #94a3b8; }
  .mem-card__menu  { color: #94a3b8; }
  .mem-card__menu:hover { color: #475569; background: rgba(0,0,0,0.04); }

  .mem-card__summary {
    background: rgba(0,0,0,0.02);
    border-color: rgba(0,0,0,0.08);
    border-left-color: #334155;
  }
  .mem-card__summary-tag  { color: #334155; }
  .mem-card__summary-text { color: #1e293b; }
  .mem-card__body         { color: #475569; }

  .mem-pill {
    border-color: rgba(0,0,0,0.1);
    background: rgba(0,0,0,0.03);
    color: #475569;
  }
}
```

- [ ] **Step 11: Add loop + learn light overrides**

Append after the last `.learn__*` rule:

```css
/* ── Loops + Learned: light mode overrides ── */
[data-theme="light"] {
  .loop { border-top-color: #e2e8f0; }
  .loop__text { color: #334155; }
  .loop__text em { color: #0f172a; }
  .loop__done {
    border-color: #e2e8f0;
    color: #64748b;
  }
  .loop__done:hover {
    background: rgba(0,0,0,0.03);
    border-color: #cbd5e1;
    color: #475569;
  }
  .cap-row { border-top-color: #e2e8f0; }

  .learn { border-top-color: #e2e8f0; }
  .learn__text { color: #1e293b; }
}
```

- [ ] **Step 12: Add StarField hide rule for light mode**

Append at the end of custom.css:

```css
/* ── StarField: hide in light mode ── */
[data-theme="light"] .starfield { display: none; }
```

- [ ] **Step 13: Verify dev server — no visual regressions in dark mode**

```bash
npm run dev
```

Open `http://localhost:3000/dashboard`. Still looks identical in dark mode. Check the memory page too.

- [ ] **Step 14: Commit**

```bash
git add src/app/custom.css
```

```bash
git commit -m "style: light mode overrides in custom.css"
```

---

## Task 4: Add `starfield` class to StarField.tsx

**Files:**
- Modify: `src/components/StarField.tsx`

- [ ] **Step 1: Add the class to the root div**

In `src/components/StarField.tsx`, find:
```tsx
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
```

Replace with:
```tsx
    <div
      aria-hidden
      className="starfield pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StarField.tsx
```

```bash
git commit -m "style: add starfield class for theme-based visibility"
```

---

## Task 5: Create ThemeProviderWrapper + wire into layout.tsx

**Files:**
- Create: `src/components/ThemeProviderWrapper.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create ThemeProviderWrapper.tsx**

Create `src/components/ThemeProviderWrapper.tsx`:

```tsx
"use client"

import { ThemeProvider } from "next-themes"

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

- [ ] **Step 2: Update layout.tsx**

In `src/app/layout.tsx`, add the import at the top (after existing imports):

```tsx
import { ThemeProviderWrapper } from "@/components/ThemeProviderWrapper"
```

Find the `<html>` opening tag:
```tsx
      <html
        lang="en"
        className={`${outfit.variable} ${dmSans.variable} ${fraunces.variable} ${jetbrainsMono.variable} h-full`}
      >
```

Replace with (add `suppressHydrationWarning`):
```tsx
      <html
        lang="en"
        className={`${outfit.variable} ${dmSans.variable} ${fraunces.variable} ${jetbrainsMono.variable} h-full`}
        suppressHydrationWarning
      >
```

Find the `<body>` opening tag:
```tsx
        <body className="min-h-full bg-depth text-text-base antialiased font-sans" suppressHydrationWarning>
          <ClerkProvider signUpForceRedirectUrl="/dashboard" signInForceRedirectUrl="/dashboard">
```

Replace with (wrap ClerkProvider in ThemeProviderWrapper):
```tsx
        <body className="min-h-full bg-depth text-text-base antialiased font-sans" suppressHydrationWarning>
          <ThemeProviderWrapper>
          <ClerkProvider signUpForceRedirectUrl="/dashboard" signInForceRedirectUrl="/dashboard">
```

Find the closing `</ClerkProvider>` tag:
```tsx
          </ClerkProvider>
        </body>
```

Replace with:
```tsx
          </ClerkProvider>
          </ThemeProviderWrapper>
        </body>
```

- [ ] **Step 3: Verify dev server — theme switching works at OS level**

```bash
npm run dev
```

Open `http://localhost:3000/dashboard`. If your OS is in light mode, the dashboard should now show the Clean Slate light theme. If dark, it stays dark. Verify no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ThemeProviderWrapper.tsx src/app/layout.tsx
```

```bash
git commit -m "feat: wire ThemeProvider into root layout"
```

---

## Task 6: Create ThemeToggle component

**Files:**
- Create: `src/components/dashboard/ThemeToggle.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/dashboard/ThemeToggle.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"

const MODES = [
  { id: "light",  icon: Sun,     label: "Light"  },
  { id: "dark",   icon: Moon,    label: "Dark"   },
  { id: "system", icon: Monitor, label: "System" },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return (
    <div style={{ padding: "6px 10px" }}>
      <div
        style={{
          background: "var(--theme-toggle-track)",
          borderRadius: "7px",
          padding: "3px",
          display: "flex",
          gap: "2px",
        }}
      >
        {MODES.map(({ id, icon: Icon, label }) => {
          const active = theme === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              style={{
                flex: 1,
                background: active ? "var(--theme-toggle-active)" : "transparent",
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.15)" : undefined,
                borderRadius: "5px",
                padding: "5px 0",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: active ? 600 : 500,
                color: active ? "var(--theme-toggle-text-active)" : "var(--theme-toggle-text)",
                transition: "all 0.15s ease",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={11} />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/ThemeToggle.tsx
```

```bash
git commit -m "feat: add ThemeToggle segmented pill component"
```

---

## Task 7: Integrate ThemeToggle into UserMenu (desktop)

**Files:**
- Modify: `src/components/dashboard/UserMenu.tsx`

- [ ] **Step 1: Add the ThemeToggle import**

At the top of `src/components/dashboard/UserMenu.tsx`, find the existing imports and add:
```tsx
import { ThemeToggle } from "@/components/dashboard/ThemeToggle"
```

- [ ] **Step 2: Update the dropdown popup — replace hardcoded hex and add ThemeToggle**

Find the dropdown div (starts with `{open && (`):
```tsx
        <div
          className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50"
          style={{
            background: "#111111",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          <button
            type="button"
            onClick={() => { setOpen(false); setAccountOpen(true) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-sans text-text-dim hover:text-text-base hover:bg-white/[0.05] transition-colors text-left"
          >
            <User size={14} className="flex-shrink-0 text-text-muted" />
            Account settings
          </button>

          <div className="mx-3" style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />

          <button
            type="button"
            onClick={() => signOut()}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-sans text-text-dim hover:text-text-base hover:bg-white/[0.05] transition-colors text-left"
          >
            <LogOut size={14} className="flex-shrink-0 text-text-muted" />
            Sign out
          </button>
        </div>
```

Replace with:
```tsx
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
```

- [ ] **Step 3: Update the trigger button's open-state background**

Find:
```tsx
        style={{ background: open ? "rgba(255,255,255,0.06)" : undefined }}
```

Replace with:
```tsx
        style={{ background: open ? "var(--theme-panel-hover)" : undefined }}
```

- [ ] **Step 4: Update the avatar fallback gradient**

Find:
```tsx
            style={{ background: "linear-gradient(135deg,#2a2a2a,#444444)" }}
```

Replace with:
```tsx
            style={{ background: "var(--theme-avatar-gradient)" }}
```

- [ ] **Step 5: Verify in browser**

Open the dashboard. Click the user menu. You should see:
- "Account settings" row
- Thin divider
- Light / Dark / System segmented pill
- Thin divider
- "Sign out" row

Click Light — dashboard switches to Clean Slate theme. Click Dark — switches back. Click System — follows OS.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/UserMenu.tsx
```

```bash
git commit -m "feat: add ThemeToggle to desktop UserMenu dropdown"
```

---

## Task 8: Integrate ThemeToggle into BottomTabBar (mobile)

**Files:**
- Modify: `src/components/dashboard/BottomTabBar.tsx`

- [ ] **Step 1: Add the ThemeToggle import**

At the top of `src/components/dashboard/BottomTabBar.tsx`, add:
```tsx
import { ThemeToggle } from "@/components/dashboard/ThemeToggle"
```

- [ ] **Step 2: Update the profile popup — replace hardcoded hex and add ThemeToggle**

Find the popup div (starts with `role="menu"`):
```tsx
          <div
            role="menu"
            className="absolute bottom-full right-0 mb-2 w-52 rounded-xl border border-border overflow-hidden z-50"
            style={{
              background: "#111111",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.8)",
            }}
          >
```

Replace with:
```tsx
          <div
            role="menu"
            className="absolute bottom-full right-0 mb-2 w-52 rounded-xl border border-border overflow-hidden z-50"
            style={{
              background: "var(--theme-surface)",
              boxShadow: "0 0 0 1px var(--theme-border), 0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
```

- [ ] **Step 3: Add ThemeToggle between Manage Account and Sign Out**

Find:
```tsx
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
```

Replace with:
```tsx
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
```

- [ ] **Step 4: Update avatar fallback gradients (there are two — in the popup header and in the tab button)**

Find the first (popup header):
```tsx
                  style={{ background: "linear-gradient(135deg,#333333,#555555)" }}
```

Replace with:
```tsx
                  style={{ background: "var(--theme-avatar-gradient)" }}
```

Find the second (tab bar button):
```tsx
              style={{ background: "linear-gradient(135deg,#333333,#555555)" }}
```

Replace with:
```tsx
              style={{ background: "var(--theme-avatar-gradient)" }}
```

- [ ] **Step 5: Verify on mobile (or resize browser to <1024px)**

Resize to mobile width. Tap the Profile tab. The popup should show:
- User info header
- Divider
- Manage Account
- Divider
- Light / Dark / System toggle
- Divider
- Sign Out

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/BottomTabBar.tsx
```

```bash
git commit -m "feat: add ThemeToggle to mobile BottomTabBar profile popup"
```

---

## Task 9: Fix GraphView.tsx — theme-aware D3 colors

**Files:**
- Modify: `src/components/memory/GraphView.tsx`

The graph uses hardcoded dark colors for edges and node labels. We need to: (1) read colors from CSS vars, (2) re-apply colors on theme change via MutationObserver.

- [ ] **Step 1: Add a `cssVar` helper and `linkSelRef` near the top of GraphView.tsx**

After the import block (after line `import GraphCanvas, { MiniMapData } from "./GraphCanvas"`), add:

```tsx
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
```

After the existing `const nodeSelRef = ...` line, add:
```tsx
  const linkSelRef = useRef<d3.Selection<SVGPathElement, EdgeDatum, SVGGElement, unknown> | null>(null)
  const applyThemeRef = useRef<(() => void) | null>(null)
```

- [ ] **Step 2: Add MutationObserver effect (insert after the `useEffect(() => { onNodeClickRef.current = onNodeClick }, [onNodeClick])` block)**

```tsx
  useEffect(() => {
    const observer = new MutationObserver(() => {
      applyThemeRef.current?.()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    })
    return () => observer.disconnect()
  }, [])
```

- [ ] **Step 3: Store `linkSel` in `linkSelRef` after it's created**

Find:
```tsx
    const linkSel = container
      .append("g")
      .selectAll<SVGPathElement, EdgeDatum>("path")
      .data(edges)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", "rgba(148,163,184,0.18)")
      .attr("stroke-width", 1.5)
```

Replace with:
```tsx
    const linkSel = container
      .append("g")
      .selectAll<SVGPathElement, EdgeDatum>("path")
      .data(edges)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", cssVar("--graph-edge-base"))
      .attr("stroke-width", 1.5)

    linkSelRef.current = linkSel
```

- [ ] **Step 4: Update node label color to use cssVar**

Find:
```tsx
    nodeSel
      .append("text")
      .attr("dy", (d) => nodeRadius(d) + 13)
      .attr("text-anchor", "middle")
      .attr("fill", "#a1a1aa")
```

Replace with:
```tsx
    nodeSel
      .append("text")
      .attr("dy", (d) => nodeRadius(d) + 13)
      .attr("text-anchor", "middle")
      .attr("fill", cssVar("--graph-label"))
```

- [ ] **Step 5: Update `applyBaseStyles` and register `applyThemeRef`**

Find:
```tsx
    function applyBaseStyles() {
      const selId = selectedIdRef.current
      linkSel.attr("stroke", "rgba(148,163,184,0.18)").attr("stroke-width", 1.5)
      nodeSel.select("circle")
        .attr("fill-opacity", 0.88)
        .attr("r", nodeRadius)
        .attr("stroke-opacity", (n) => n.id === selId ? 1.0 : 0.4)
        .attr("stroke-width", (n) => n.id === selId ? 4 : 2)
        .attr("filter", (n) => n.id === selId ? "url(#glow-hover)" : glowFilter(n))
      nodeSel.select("text").attr("fill", "#a1a1aa")
    }
```

Replace with:
```tsx
    function applyBaseStyles() {
      const selId = selectedIdRef.current
      linkSel.attr("stroke", cssVar("--graph-edge-base")).attr("stroke-width", 1.5)
      nodeSel.select("circle")
        .attr("fill-opacity", 0.88)
        .attr("r", nodeRadius)
        .attr("stroke-opacity", (n) => n.id === selId ? 1.0 : 0.4)
        .attr("stroke-width", (n) => n.id === selId ? 4 : 2)
        .attr("filter", (n) => n.id === selId ? "url(#glow-hover)" : glowFilter(n))
      nodeSel.select("text").attr("fill", cssVar("--graph-label"))
    }

    applyThemeRef.current = applyBaseStyles
```

- [ ] **Step 6: Update `applySearchHighlight` to use cssVars**

Find:
```tsx
    function applySearchHighlight(q: string) {
      if (!q) { applyBaseStyles(); return }
      const lower = q.toLowerCase()
      const matchIds = new Set(nodes.filter((n) => n.name.toLowerCase().includes(lower)).map((n) => n.id))
      linkSel
        .attr("stroke", (e) => {
          const src = (e.source as NodeDatum).id
          const tgt = (e.target as NodeDatum).id
          return matchIds.has(src) || matchIds.has(tgt) ? "rgba(148,163,184,0.5)" : "rgba(148,163,184,0.04)"
        })
      nodeSel.select("text")
        .attr("fill", (n) => matchIds.has(n.id) ? "#e4e4e7" : "#27272a")
    }
```

Replace with:
```tsx
    function applySearchHighlight(q: string) {
      if (!q) { applyBaseStyles(); return }
      const lower = q.toLowerCase()
      const matchIds = new Set(nodes.filter((n) => n.name.toLowerCase().includes(lower)).map((n) => n.id))
      const edgeHi = cssVar("--graph-edge-hi")
      const edgeLo = cssVar("--graph-edge-lo")
      const labelHi = cssVar("--graph-label-hi")
      const labelLo = cssVar("--graph-label-lo")
      linkSel
        .attr("stroke", (e) => {
          const src = (e.source as NodeDatum).id
          const tgt = (e.target as NodeDatum).id
          return matchIds.has(src) || matchIds.has(tgt) ? edgeHi : edgeLo
        })
      nodeSel.select("text")
        .attr("fill", (n) => matchIds.has(n.id) ? labelHi : labelLo)
    }
```

- [ ] **Step 7: Update the mouseover handler node text colors**

Find:
```tsx
      nodeSel.select("text")
        .attr("fill", (n) =>
          n.id === d.id ? "#e4e4e7" : neighbors.has(n.id) ? "#a1a1aa" : "#3f3f46"
        )
    })
```

Replace with:
```tsx
      nodeSel.select("text")
        .attr("fill", (n) =>
          n.id === d.id
            ? cssVar("--graph-label-hi")
            : neighbors.has(n.id)
              ? cssVar("--graph-label")
              : cssVar("--graph-label-lo")
        )
    })
```

- [ ] **Step 8: Confirm existing ref assignments are still present**

After the `applyBaseStyles` and `applySearchHighlight` functions, confirm these two lines are still in the file (they should be unchanged):
```tsx
    applyBaseRef.current = applyBaseStyles
    applySearchRef.current = applySearchHighlight
```

The `applyThemeRef.current = applyBaseStyles` added in Step 5 sits immediately after the `function applyBaseStyles() { ... }` closing brace — before these two lines. All three ref assignments coexist. No additional edits needed.

- [ ] **Step 9: Verify graph in light mode**

Open `http://localhost:3000/dashboard/memory`. Switch to Light mode via the toggle. The graph should:
- Have a light/white background
- Show node labels in gray (readable on white)
- Show edges in dark-tinted rgba (visible on white)
- Switch back instantly when toggling to Dark

- [ ] **Step 10: Commit**

```bash
git add src/components/memory/GraphView.tsx
```

```bash
git commit -m "feat: theme-aware D3 colors in GraphView with MutationObserver"
```

---

## Task 10: Fix GraphCanvas.tsx — MiniMap edge stroke

**Files:**
- Modify: `src/components/memory/GraphCanvas.tsx`

- [ ] **Step 1: Update MiniMapSvg edge stroke**

In `src/components/memory/GraphCanvas.tsx`, find the `<line>` element inside `MiniMapSvg`:
```tsx
        <line
          key={i}
          x1={e.sourceX} y1={e.sourceY}
          x2={e.targetX} y2={e.targetY}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeW}
        />
```

Replace with:
```tsx
        <line
          key={i}
          x1={e.sourceX} y1={e.sourceY}
          x2={e.targetX} y2={e.targetY}
          style={{ stroke: "var(--graph-minimap-edge)" }}
          strokeWidth={strokeW}
        />
```

- [ ] **Step 2: Verify minimap edge visibility in both themes**

Open `http://localhost:3000/dashboard/memory`. The OVERVIEW minimap in the top-left of the graph should show faint edges in both light and dark mode (not invisible white-on-white).

- [ ] **Step 3: Commit**

```bash
git add src/components/memory/GraphCanvas.tsx
```

```bash
git commit -m "fix: theme-aware minimap edge stroke in GraphCanvas"
```

---

## Task 11: Full integration verification

No code changes — manual verification pass.

- [ ] **Step 1: Verify all 4 dashboard pages in Light mode**

Set theme to Light via the toggle. Visit each page and confirm no dark-on-dark or white-on-white text issues:
- `http://localhost:3000/dashboard` (HQ / Brief)
- `http://localhost:3000/dashboard/memory`
- `http://localhost:3000/dashboard/integrations`
- `http://localhost:3000/dashboard/settings`

- [ ] **Step 2: Verify all 4 pages in Dark mode**

Set theme to Dark. Confirm no regressions from the original dark theme.

- [ ] **Step 3: Verify System mode**

Set to System. Toggle your OS appearance setting (System Preferences → Appearance on macOS) and confirm the dashboard follows automatically without a page reload.

- [ ] **Step 4: Verify theme persists on page reload**

Set theme to Light. Reload the page (`Cmd+R`). Theme should still be Light with no flash of dark content.

- [ ] **Step 5: Verify mobile dropdown**

Resize browser to <1024px wide. Tap the Profile tab. Confirm ThemeToggle appears and functions in the mobile popup.

- [ ] **Step 6: Verify graph re-colors on toggle**

On the Memory page, switch theme while looking at the graph. Edges and labels should update instantly (no page reload required).

- [ ] **Step 7: Run tests to confirm no regressions**

```bash
npm run test
```

Expected: all existing tests still pass (graphMiniMap, trigger, API tests).

- [ ] **Step 8: Final commit (if any last fixes needed)**

```bash
git add -A
```

```bash
git commit -m "fix: theme integration cleanup"
```
