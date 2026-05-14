# Launch-Prep Branch Strategy Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `launch-prep` branch that has the centered landing page Navbar from `landing-launch` and the full working dashboard (Memory, Telegram, entity extraction) from `feature/mvp-connect-step`.

**Architecture:** Branch from `feature/mvp-connect-step` (which already has all working code), then overwrite exactly one file with its `landing-launch` equivalent. The diff between the two branches is 14 files total — and only one of those is a visual regression we need to restore.

**Tech Stack:** git, Next.js 15, Prisma, Trigger.dev, Clerk, Anthropic SDK.

---

## Audit Summary

### The surprise finding

The user's premise — that `landing-launch` has a "polished landing page" and `feature/mvp-connect-step` has an "older, less-polished landing page + full dashboard" — is **partially wrong in an important way**.

Both branches already contain all the dashboard code (Memory page, Integrations, Telegram API routes, Trigger.dev tasks, Goals, Settings, etc.). On `landing-launch`, that code is **inaccessible** because three files make the dashboard appear incubating:

| File | `landing-launch` | `feature/mvp-connect-step` |
|---|---|---|
| `src/app/dashboard/layout.tsx` | Bare centered layout (no sidebar) | Full sidebar + mobile nav |
| `src/app/dashboard/page.tsx` | Renders the egg 🥚 incubating page | Redirects to `/dashboard/memory` |
| `src/app/dashboard/[...slug]/page.tsx` | EXISTS — redirects everything back to `/dashboard` | DOES NOT EXIST |

When a user visits `/dashboard/memory` on `landing-launch`, the `[...slug]` catch-all intercepts it and redirects to `/dashboard`, which renders the incubating egg. The Memory page file exists on `landing-launch` — it's just unreachable.

**This means: branching from `feature/mvp-connect-step` already gives us the working dashboard. No dashboard files need to be copied.**

### Prisma schema and migrations

Identical on both branches. No diff in `prisma/schema.prisma` or `prisma/migrations/`. Confirmed via `git diff --name-status landing-launch feature/mvp-connect-step -- prisma/`.

### Package.json, tsconfig, next.config, middleware, globals.css, root layout

All identical on both branches. No action needed.

### Public assets

Identical on both branches. Both have `birdbot-animated (1).svg`, `birdbot-animated (2).svg`, and all other static assets.

---

## File-by-file plan

Total files differing between branches: **14**. Breakdown:

| File | Category | Which branch wins | Reason |
|---|---|---|---|
| `src/components/landing/Navbar.tsx` | LANDING PAGE | **landing-launch** | Has centered absolute positioning for desktop nav — a deliberate polish commit. `feature/mvp-connect-step` removed it. |
| `src/components/landing/HeroSection.tsx` | LANDING PAGE | **feature/mvp-connect-step** | Has iOS GPU-acceleration fix (`translateZ(0)` for blur animations) and uses `next/image` for the animated bird SVG (better loading). `landing-launch` uses the inline `BirdbotIcon` SVG component instead. |
| `src/components/landing/PricingButton.tsx` | LANDING PAGE | **feature/mvp-connect-step** | Has actual Stripe checkout integration. `landing-launch` version just redirects to `/dashboard` for signed-in users — broken for production billing. |
| `src/components/landing/StepCard.tsx` | LANDING PAGE | **feature/mvp-connect-step** | Has corrected `height: 260` (was 280, had a formatting bug alongside the height value). |
| `src/components/landing/WaitlistCTA.tsx` | LANDING PAGE | **feature/mvp-connect-step** | Simpler server component (no `"use client"`, no `useAuth` hook). Both versions are functionally similar; feature branch version has better SSR performance. Uses `(2).svg` for the bird (same asset, just a rename). |
| `src/components/landing/visuals/PickHomeVisual.tsx` | LANDING PAGE | **feature/mvp-connect-step** | Adds a drop-shadow filter to the bird image. |
| `src/app/custom.css` | CONFIG/INFRA | **feature/mvp-connect-step** | Removes the `egg-shake` keyframe animation (only used by the incubating dashboard page being removed). No other references to it. |
| `src/app/dashboard/layout.tsx` | DASHBOARD | **feature/mvp-connect-step** | Full sidebar + mobile layout. `landing-launch` has a bare centered wrapper. |
| `src/app/dashboard/page.tsx` | DASHBOARD | **feature/mvp-connect-step** | Redirects to `/dashboard/memory`. `landing-launch` renders the egg incubating page. |
| `src/app/dashboard/[...slug]/page.tsx` | DASHBOARD | **feature/mvp-connect-step** (absent) | Only exists on `landing-launch` — a catch-all that redirects all dashboard subroutes to the incubating egg page. We do NOT want this. Since we branch from `feature/mvp-connect-step`, it won't exist. |
| `src/components/ui/BirdbotIcon.tsx` | OTHER | **feature/mvp-connect-step** (absent) | Inline SVG component used only by `landing-launch`'s `HeroSection`. Since `feature/mvp-connect-step`'s `HeroSection` uses `next/image` instead, this component is unused. We do NOT want it. |
| `docs/superpowers/plans/2026-04-26-incubating-page.md` | OTHER | **feature/mvp-connect-step** (absent) | Docs for the now-removed incubating page. Irrelevant. |
| `docs/superpowers/specs/2026-04-26-incubating-page-design.md` | OTHER | **feature/mvp-connect-step** (absent) | Same. |
| `docs/sprints/2026-04-bird-telegram-capture.md` | OTHER | **feature/mvp-connect-step** | The sprint plan we added today. Stays. |

**Net execution: branch from `feature/mvp-connect-step`, copy exactly 1 file from `landing-launch`.**

---

## Risk assessment

### Low risk: Navbar.tsx

Simple overwrite. The centered absolute positioning is a CSS-only change. No component API changes, no import changes, no cross-file dependencies. Risk: none.

### Noted but not risky: auth-conditional CTAs

`landing-launch`'s `HeroSection.tsx` and `WaitlistCTA.tsx` show "Go to Dashboard" for signed-in users. `feature/mvp-connect-step` simplified both to always show "Try BirdBot free" (likely during dashboard development to avoid hitting the incubating page).

For production launch this is a minor UX regression — signed-in users on the landing page won't see "Go to Dashboard." The fix is two lines in `HeroSection.tsx`:

```tsx
// In HeroSection.tsx, the CTA button label (around line 154)
// Change:
{isLoaded && isSignedIn ? "Go to Dashboard" : "Try BirdBot free"}
// Already rendered as:
"Try BirdBot free"
```

This is optional for the branch-creation task. It can be done as a follow-up commit on `launch-prep`. Do NOT copy the entire `HeroSection.tsx` from `landing-launch` to fix this — you'd lose the iOS GPU fix and `next/image` optimization.

### No risk: Prisma / schema / migrations

All identical. Zero chance of migration conflict.

### No risk: `BirdbotIcon.tsx` missing

`feature/mvp-connect-step`'s `HeroSection.tsx` does not import `BirdbotIcon`. The file being absent causes no breakage.

### No risk: public assets

Identical on both branches. Both `(1).svg` and `(2).svg` are present.

---

## Execution plan

### Task 1: Create the launch-prep branch

- [ ] **Step 1: Confirm local branch is up to date**

```bash
git -C /path/to/birdbot-cloud fetch origin
git -C /path/to/birdbot-cloud checkout feature/mvp-connect-step
git -C /path/to/birdbot-cloud status
```

Expected: `On branch feature/mvp-connect-step`, `nothing to commit, working tree clean`.

- [ ] **Step 2: Create launch-prep from feature/mvp-connect-step**

```bash
git -C /path/to/birdbot-cloud checkout -b launch-prep
```

Expected: `Switched to a new branch 'launch-prep'`

- [ ] **Step 3: Verify the branch has all dashboard routes working**

```bash
git -C /path/to/birdbot-cloud ls-tree -r --name-only launch-prep src/app/dashboard/
```

Expected output (no `[...slug]` line):
```
src/app/dashboard/goals/page.tsx
src/app/dashboard/integrations/page.tsx
src/app/dashboard/layout.tsx
src/app/dashboard/memory/page.tsx
src/app/dashboard/page.tsx
src/app/dashboard/settings/page.tsx
```

---

### Task 2: Copy the Navbar from landing-launch

- [ ] **Step 1: Copy `Navbar.tsx` from landing-launch**

```bash
git -C /path/to/birdbot-cloud checkout landing-launch -- src/components/landing/Navbar.tsx
```

Expected: no output (silent success)

- [ ] **Step 2: Verify the change is the centered nav**

```bash
git -C /path/to/birdbot-cloud diff HEAD src/components/landing/Navbar.tsx
```

Expected: the diff should show `absolute left-1/2 -translate-x-1/2` being added back to the nav element, and the comment "Desktop nav links — absolutely centered so logo/CTA width doesn't shift them" being restored.

- [ ] **Step 3: Commit**

```bash
git -C /path/to/birdbot-cloud add src/components/landing/Navbar.tsx
git -C /path/to/birdbot-cloud commit -m "feat(landing): restore centered absolute nav from landing-launch"
```

---

### Task 3: Verify build passes

- [ ] **Step 1: Install dependencies** (confirm node_modules is current)

```bash
cd /path/to/birdbot-cloud && npm install
```

Expected: no new packages installed (lockfile unchanged between branches)

- [ ] **Step 2: Run type check**

```bash
cd /path/to/birdbot-cloud && npx tsc --noEmit
```

Expected: no errors. If there are errors related to `BirdbotIcon` import, that means a file wasn't fully captured in the diff — investigate before continuing.

- [ ] **Step 3: Run build**

```bash
cd /path/to/birdbot-cloud && npm run build
```

Expected: build succeeds. Watch for:
- Any missing module errors (would indicate an import references a file that doesn't exist)
- Any `BirdbotIcon` import errors (would indicate a file that still references it wasn't caught in the diff)
- Any dashboard route errors (verify `/dashboard/memory`, `/dashboard/integrations` are in the build output)

- [ ] **Step 4: Run dev server and spot-check**

```bash
cd /path/to/birdbot-cloud && npm run dev
```

Check these URLs at `http://localhost:3000`:
1. `/` — landing page renders, animated bird visible, nav links are centered on desktop
2. `/dashboard/memory` — goes to Memory page with sidebar (NOT the incubating egg)
3. `/dashboard/integrations` — goes to Integrations page with sidebar
4. Browser console: no unhandled errors

---

### Task 4: Push the branch

- [ ] **Step 1: Push launch-prep to origin**

```bash
git -C /path/to/birdbot-cloud push -u origin launch-prep
```

Expected: branch pushed, tracking set.

---

## Optional follow-up: restore auth-conditional CTAs

After the branch is created and confirmed working, if you want signed-in users to see "Go to Dashboard" on the hero:

**File:** `src/components/landing/HeroSection.tsx` (around line 154)

Change:
```tsx
Try BirdBot free
```

To:
```tsx
{isLoaded && isSignedIn ? "Go to Dashboard" : "Try BirdBot free"}
```

The `isLoaded` and `isSignedIn` variables are already declared at the top of `HeroSection` — this is a 1-line diff. Then commit:

```bash
git -C /path/to/birdbot-cloud add src/components/landing/HeroSection.tsx
git -C /path/to/birdbot-cloud commit -m "feat(landing): show 'Go to Dashboard' for signed-in users on hero CTA"
```

---

## Test plan after Path C

Before deploying `launch-prep` to production, verify:

### Landing page parity with production
- [ ] Nav links are centered horizontally between logo and CTA (the absolute positioning)
- [ ] Animated bird appears and floats in the hero — test on iOS Safari specifically (the GPU fix)
- [ ] "How it works" step cards render at the correct height (260px visual area)
- [ ] PickHomeVisual card shows the bird with glow/shadow
- [ ] Pricing section CTA buttons trigger Stripe checkout (not a redirect to `/dashboard`)
- [ ] Footer CTA section shows the bird from `(2).svg`

### Dashboard works
- [ ] `/dashboard` redirects to `/dashboard/memory`
- [ ] `/dashboard/memory` renders the Memory page with Sidebar + BottomTabBar
- [ ] `/dashboard/integrations` renders the Integrations page — "Connect Telegram" flow generates a deep link
- [ ] `/dashboard/settings` renders the Settings page with user info
- [ ] No `[...slug]` catch-all is intercepting routes (visit `/dashboard/memory` directly — should NOT redirect to `/dashboard`)

### No broken imports
- [ ] `npm run build` passes with 0 errors
- [ ] Browser console on `/` and `/dashboard/memory` shows 0 errors

### Env vars (for Vercel preview deploy)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk auth
- [ ] `DATABASE_URL` + `DIRECT_URL` — Neon
- [ ] `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_BOT_USERNAME` — Telegram
- [ ] `ANTHROPIC_API_KEY` — entity extraction
- [ ] `TRIGGER_SECRET_KEY` — Trigger.dev task dispatch
- [ ] `NEXT_PUBLIC_APP_URL` — Stripe redirects, OG images
- [ ] Stripe vars — `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs

---

## The actual git commands (exact)

Replace `<repo>` with the path `/Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud`.

```bash
git -C <repo> checkout feature/mvp-connect-step
```

```bash
git -C <repo> checkout -b launch-prep
```

```bash
git -C <repo> checkout landing-launch -- src/components/landing/Navbar.tsx
```

```bash
git -C <repo> add src/components/landing/Navbar.tsx
```

```bash
git -C <repo> commit -m "feat(landing): restore centered absolute nav from landing-launch"
```

```bash
git -C <repo> push -u origin launch-prep
```

That's the complete execution. Six commands.
