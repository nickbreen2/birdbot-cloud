# Incubating Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the authenticated dashboard with a single full-screen incubating holding page showing a shaking egg emoji, a heading, and a sub-line — no navigation.

**Architecture:** Gut `dashboard/layout.tsx` to a bare centered wrapper, replace `dashboard/page.tsx` with static incubating content, add a catch-all redirect for all `/dashboard/*` sub-routes, and add the CSS shake animation to `custom.css`.

**Tech Stack:** Next.js App Router (server components), Tailwind v4, hand-written CSS in `custom.css`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/custom.css` | Modify | Add `@keyframes egg-shake` + `.egg-shake` utility class |
| `src/app/dashboard/layout.tsx` | Modify | Bare full-screen centered wrapper — no nav, sidebar, or modals |
| `src/app/dashboard/page.tsx` | Modify | Incubating page: egg + heading + subtext |
| `src/app/dashboard/[...slug]/page.tsx` | Create | Catch-all — redirects any `/dashboard/*` URL back to `/dashboard` |

---

### Task 1: Add egg-shake animation to `custom.css`

**Files:**
- Modify: `src/app/custom.css`

> This is purely presentational CSS — verification is visual (dev server). No vitest test needed.

- [ ] **Step 1: Append the keyframe and class to `src/app/custom.css`**

Add after the existing `@keyframes slide-up` block:

```css
@keyframes egg-shake {
  0%, 14%, 100% { transform: translateX(0) rotate(0deg); }
  2%            { transform: translateX(-6px) rotate(-4deg); }
  5%            { transform: translateX(6px)  rotate(4deg); }
  8%            { transform: translateX(-5px) rotate(-3deg); }
  11%           { transform: translateX(4px)  rotate(2deg); }
  14%           { transform: translateX(0)    rotate(0deg); }
}

.egg-shake {
  display: inline-block;
  animation: egg-shake 3.5s ease-in-out infinite;
}
```

Timing rationale: motion occupies 0–14% of the 3.5 s cycle (~0.49 s of wiggle), egg sits still for the remaining ~3 s.

- [ ] **Step 2: Commit**

```bash
git add src/app/custom.css
git commit -m "feat: add egg-shake CSS animation"
```

---

### Task 2: Gut the dashboard layout

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Replace the entire file contents**

The new file removes all dashboard chrome (Sidebar, MobileHeader, BottomTabBar, SettingsModal, AccountModal, WizardProvider) and replaces it with a bare centered wrapper:

```tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-depth flex items-center justify-center">
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/layout.tsx
git commit -m "feat: gut dashboard layout to bare centered wrapper"
```

---

### Task 3: Replace dashboard page with incubating content

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Replace the entire file contents**

Remove the existing `redirect("/dashboard/memory")` and replace with the incubating page:

```tsx
export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center px-4">
      <span className="egg-shake text-8xl select-none" role="img" aria-label="egg">
        🥚
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold text-text-base">
          Your Birdbot is Incubating
        </h1>
        <p className="text-text-dim text-base">
          We&apos;ll notify you when it&apos;s hatched.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: incubating holding page replaces dashboard"
```

---

### Task 4: Add catch-all redirect for all `/dashboard/*` sub-routes

**Files:**
- Create: `src/app/dashboard/[...slug]/page.tsx`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p src/app/dashboard/\[...slug\]
```

Then create `src/app/dashboard/[...slug]/page.tsx` with:

```tsx
import { redirect } from "next/navigation"

export default function DashboardCatchAll() {
  redirect("/dashboard")
}
```

This intercepts any direct navigation to `/dashboard/memory`, `/dashboard/goals`, `/dashboard/settings`, etc. and sends the user back to the incubating page.

- [ ] **Step 2: Commit**

```bash
git add "src/app/dashboard/[...slug]/page.tsx"
git commit -m "feat: redirect all dashboard sub-routes to incubating page"
```

---

### Task 5: Visual verification

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud
npm run dev
```

- [ ] **Step 2: Open the dashboard in a browser**

Navigate to `http://localhost:3000/dashboard` (sign in if redirected to sign-in page first).

Expected:
- Full dark screen (`#0a0e1a` background), no sidebar, no tab bar, no header
- Large 🥚 emoji centered on screen
- Egg shakes for ~0.5 s, then sits still for ~3 s, then repeats
- Heading "Your Birdbot is Incubating" below the egg
- Sub-line "We'll notify you when it's hatched." below the heading

- [ ] **Step 3: Verify catch-all redirect**

Navigate directly to `http://localhost:3000/dashboard/memory`.

Expected: redirected immediately to `/dashboard` (incubating page).

- [ ] **Step 4: Stop the dev server and confirm**

All visual checks pass. No console errors.
