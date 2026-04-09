# Mobile Dashboard Navigation — Design Spec

**Date:** 2026-04-08
**Status:** Approved

## Problem

The dashboard layout renders a fixed 256px sidebar on all screen sizes. On phones and tablets (< 1024px), the sidebar occupies the left portion of the screen and the main content is pushed right via `ml-64`, leaving almost no usable space for the actual page content.

Desktop is unaffected and must remain unchanged.

## Solution

Bottom tab bar navigation pattern for mobile/tablet, with a top header replacing the sidebar's branding and account slots.

## Breakpoint

`lg` (1024px) is the cutoff:
- **< 1024px (phones + all iPad sizes):** mobile layout — no sidebar, top header + bottom tab bar
- **≥ 1024px (desktop):** existing sidebar layout, unchanged

## Components

### New: `MobileHeader.tsx`

A sticky top bar, visible only on `< lg`. Contains:

- **Left:** BirdBot instance widget — egg icon + agent name + animated status dot (same data as the sidebar's top slot, driven by the same `useWizard()` hook). Tapping it opens the existing `SettingsModal`.
- **Right:** Profile avatar circle (user's initials, matching `UserMenu` style). Tapping opens an inline dropdown with:
  - User name + email (non-interactive header row)
  - **BirdBot Settings** → opens `SettingsModal`
  - **Manage Account** → opens `AccountModal`
  - **Sign Out** → calls Clerk's `signOut()`

The dropdown closes on outside click and on any item selection.

### New: `BottomTabBar.tsx`

A fixed bottom bar, visible only on `< lg`. Safe-area aware (`pb-safe` / `env(safe-area-inset-bottom)` for iPhone notch).

**4 visible tabs + 1 "More" tab:**

| Position | Label | Icon | href |
|----------|-------|------|------|
| 1 | Chat | MessageSquare | `/dashboard/chat` |
| 2 | Integrations | Plug | `/dashboard/integrations` |
| 3 | Usage | BarChart2 | `/dashboard/usage` |
| 4 | Plan | CreditCard | `/dashboard/plan` |
| 5 | More | MoreHorizontal | — (opens sheet) |

Active tab is highlighted (blue tint, matching desktop sidebar active style).

### New: `MobileMoreSheet.tsx`

A bottom sheet that slides up when the "More" tab is tapped. Contains the remaining nav items and utility links:

- AI Models (`/dashboard/models`)
- Skills (`/dashboard/skills`)
- Support (`/dashboard/support`)
- Set Up AI Credits (`/dashboard/models`)
- Refer & Earn

Tapping any item navigates and closes the sheet. Sheet closes on backdrop tap or swipe down.

## Changed Files

### `Sidebar.tsx`

Add `hidden lg:flex` to the `<aside>` element so it is invisible below the `lg` breakpoint. No other changes.

### `layout.tsx`

- Add `lg:ml-64` to the `<main>` element (currently `ml-64` — applies on all sizes). On mobile, `ml-0` is the default so no explicit class needed.
- Render `<MobileHeader />` and `<BottomTabBar />` inside the layout, both hidden at `lg+` via `lg:hidden`.
- Add bottom padding to `<main>` on mobile to prevent content from being obscured by the tab bar: `pb-16 lg:pb-0` (tab bar is ~64px tall).

## Data Flow

All new components share the existing `WizardContext` (via `useWizard()`) for agent state and modal open/close actions. No new state or context is introduced.

`UserMenu` logic (sign out, account modal) is duplicated into the `MobileHeader` profile dropdown — not abstracted, since the two UIs are structurally different (sidebar bottom slot vs. top-right dropdown).

## Out of Scope

- No changes to desktop layout
- No changes to page content components
- No new routes
- Tablet-specific layouts (iPad split-view, etc.) are not addressed; the same mobile layout is used for all `< lg` sizes
