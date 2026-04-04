# Custom User Menu Design

**Date:** 2026-04-03  
**Status:** Approved  

## Overview

Replace the default Clerk `<UserButton />` in the sidebar bottom section with a fully custom, on-theme user menu. The current Clerk component renders a white dropdown that clashes with BirdBot's dark design system. The replacement will use Clerk hooks directly and theme the Clerk account panel via the `appearance` API.

## Decisions Made

| Question | Decision |
|---|---|
| Dropdown menu items | BirdBot Settings + Manage Account + Sign Out |
| "Manage Account" experience | Clerk's built-in UserProfile panel, themed dark |
| Dropdown interaction pattern | Floating popup above the user card |

## Components

### 1. `UserMenu` component (new)

A self-contained component that renders the user card trigger and the floating dropdown. Lives at `src/components/dashboard/UserMenu.tsx`.

**Trigger (always visible):**
- Replaces the current `<UserButton />` + name/email layout in `Sidebar.tsx`
- Shows a blue gradient avatar circle with the user's initials
- Shows first name + email
- Clicking toggles the dropdown open/closed
- When open: subtle blue border glow on the card

**Dropdown (conditional):**
- Floats above the card, anchored to its bottom edge
- Background: `#141a2c`, border: `#1e2a45`, blue glow box-shadow
- Closes on: clicking outside (via `useEffect` + `mousedown` listener), clicking any menu item, pressing Escape
- Renders above the card to avoid being clipped by sidebar overflow

**Menu items:**
1. **Header row** — avatar + full name + email (non-interactive, decorative)
2. Divider
3. **BirdBot Settings** — calls `setSettingsOpen(true)` from `useWizard()`, highlighted blue
4. **Manage Account** — calls `openUserProfile()` from `useClerk()`
5. Divider
6. **Sign Out** — calls `signOut()` from `useClerk()`

### 2. Clerk `appearance` prop on `<ClerkProvider>`

Applied in `src/app/layout.tsx` to theme the UserProfile modal dark. Clerk's appearance API uses a `variables` sub-object:

```ts
appearance={{
  variables: {
    colorBackground: '#141a2c',
    colorInputBackground: '#0e1425',
    colorInputText: '#f1f5f9',
    colorText: '#f1f5f9',
    colorTextSecondary: '#94a3b8',
    colorPrimary: '#2563eb',
    colorDanger: '#ef4444',
    borderRadius: '0.75rem',
    fontFamily: 'var(--font-dm-sans)',
  },
}}

## File Changes

| File | Change |
|---|---|
| `src/components/dashboard/UserMenu.tsx` | Create new component |
| `src/components/dashboard/Sidebar.tsx` | Replace `<UserButton />` + surrounding div with `<UserMenu />` |
| `src/app/layout.tsx` | Add `appearance` prop to `<ClerkProvider>` |

## Behaviour Details

- **Avatar initials:** derived from `user.firstName` + `user.lastName` (first letters), or `user.username[0]`, or `"U"` as fallback
- **Dropdown position:** `absolute`, `bottom-full`, `left-0`, `right-0`, `mb-2` — renders above the card. The `UserMenu` wrapper needs `position: relative` and `z-index: 50` on the dropdown so it layers above the nav items in the sidebar's flex column.
- **Click-outside:** `useEffect` attaches a `mousedown` listener to `document`; checks if the click target is outside the menu's ref before closing
- **Escape key:** `keydown` listener on `document` closes the dropdown when open
- **No animation required** for v1 — simple conditional render is fine

## Out of Scope

- Custom-built account management (email change, password change flows) — deferred, Clerk panel handles this
- Notifications menu item
- Multiple accounts / workspace switching
