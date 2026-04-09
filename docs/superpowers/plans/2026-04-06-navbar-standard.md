# Navbar: Pill → Standard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the landing page navbar from a floating glass pill to a full-width solid dark bar with a bottom border.

**Architecture:** Single-file change to `src/components/landing/Navbar.tsx`. Desktop container loses its margins, rounding, and backdrop blur. Mobile dropdown becomes a full-width solid panel with stacked auth buttons. No logic changes — only Tailwind classes and inline styles.

**Tech Stack:** Next.js, React, Tailwind CSS, Clerk

---

## Files

- Modify: `src/components/landing/Navbar.tsx`

---

### Task 1: Update desktop navbar container

**Files:**
- Modify: `src/components/landing/Navbar.tsx:39-46`

This task removes the pill appearance from the desktop navbar. The inner `<div>` currently has side/top margins (`mx-4 mt-3`), heavy rounding (`rounded-2xl`), a full border on all sides, a max-width cap, a semi-transparent background, and a backdrop blur. All of those go away. It becomes a flat, full-width, solid dark bar with only a bottom border.

- [ ] **Step 1: Open the file and find the inner container div (line 39)**

The current code looks like this:

```tsx
<div
  className="mx-4 mt-3 rounded-2xl border border-border px-4 sm:px-6 py-3 flex items-center justify-between max-w-full"
  style={{
    background: "rgba(10, 14, 26, 0.85)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  }}
>
```

- [ ] **Step 2: Replace it with the full-width solid bar**

```tsx
<div
  className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between"
  style={{ background: "#0a0e1a" }}
>
```

Changes made:
- Removed `mx-4 mt-3` (margins that created the floating pill gap)
- Removed `rounded-2xl` (pill rounding)
- Changed `border border-border` → `border-b border-border` (all-sides border → bottom-only)
- Removed `max-w-full` (unnecessary on a full-width element)
- Background changed from `rgba(10, 14, 26, 0.85)` → `#0a0e1a` (fully opaque)
- Removed `backdropFilter` and `WebkitBackdropFilter` (blur not needed with opaque background)

- [ ] **Step 3: Commit**

```
git add src/components/landing/Navbar.tsx
git commit -m "feat: convert desktop navbar from pill to full-width solid bar"
```

---

### Task 2: Update mobile dropdown

**Files:**
- Modify: `src/components/landing/Navbar.tsx:143-201`

The mobile dropdown currently renders as a floating pill card with side margins, rounded corners, and a glass background. It becomes a full-width solid panel that drops directly below the navbar, matching its styling. The auth buttons (Sign In / Get Started) are stacked vertically and go full-width.

- [ ] **Step 1: Find the mobile dropdown outer div (line 143)**

Current code:

```tsx
<div
  className="lg:hidden mx-3 sm:mx-4 mt-1.5 rounded-2xl border border-border"
  style={{
    background: "rgba(10, 14, 26, 0.96)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  }}
>
```

- [ ] **Step 2: Replace with full-width solid dropdown**

```tsx
<div
  className="lg:hidden border-b border-border"
  style={{ background: "#0a0e1a" }}
>
```

Changes:
- Removed `mx-3 sm:mx-4 mt-1.5` (side/top margins that floated the pill)
- Removed `rounded-2xl` (pill rounding)
- Changed `border border-border` → `border-b border-border` (bottom-only border)
- Background changed to solid `#0a0e1a`
- Removed `backdropFilter` and `WebkitBackdropFilter`

- [ ] **Step 3: Find the unauthenticated mobile auth buttons section (around line 185)**

Current code (inside the `else` branch):

```tsx
<button
  onClick={() => openModal('sign-in')}
  className="w-full text-sm text-left px-3 py-2.5 rounded-xl font-sans transition-colors text-text-dim hover:text-text-base hover:bg-panel"
>
  Sign In
</button>
<Button size="sm" className="w-full justify-center" onClick={() => openModal('sign-up')}>
  Get Started
</Button>
```

- [ ] **Step 4: Update Sign In to ghost/bordered style and center text**

```tsx
<button
  onClick={() => openModal('sign-in')}
  className="w-full text-sm text-center px-3 py-2.5 rounded-xl font-sans transition-colors text-text-dim hover:text-text-base hover:bg-panel border border-border"
>
  Sign In
</button>
<Button size="sm" className="w-full justify-center" onClick={() => openModal('sign-up')}>
  Get Started
</Button>
```

Only changes to Sign In:
- `text-left` → `text-center`
- Added `border border-border`

`Button` component already renders full-width via `w-full justify-center` — no change needed.

- [ ] **Step 5: Commit**

```
git add src/components/landing/Navbar.tsx
git commit -m "feat: convert mobile menu from floating pill to full-width dropdown with stacked auth buttons"
```

---

### Task 3: Visual verification

**Files:** none — verification only

This is a pure styling change with no business logic to unit test. Verify visually in the browser.

- [ ] **Step 1: Ensure `.env.local` has the required keys, then start the dev server**

```bash
cd birdbot-cloud
npm run dev
```

Open `http://localhost:3000` in the browser.

- [ ] **Step 2: Check desktop navbar**

Verify:
- Bar spans full viewport width, no side gaps
- Flush to top — no top gap
- Solid dark background (no blur/glass effect)
- Thin horizontal line at the bottom separating it from page content
- Logo, nav links, and CTA buttons look unchanged

- [ ] **Step 3: Check mobile navbar (narrow the browser to < 1024px)**

Verify:
- Hamburger button still visible and functional
- Tapping hamburger opens a full-width panel directly below the navbar (no floating card)
- Panel background is solid dark, same as the navbar
- Nav links visible with dividers
- Sign In button has a border and centered text
- Get Started button is solid blue, full width
- Both buttons stacked vertically
- Tapping a link closes the menu

- [ ] **Step 4: Check signed-in state (optional — requires a logged-in Clerk session)**

Verify the signed-in mobile menu shows Sign Out and Dashboard button stacked correctly (these weren't changed but confirm nothing regressed).
