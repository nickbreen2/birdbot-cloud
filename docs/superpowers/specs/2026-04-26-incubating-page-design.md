# Incubating Page Design

**Branch:** `landing-launch`  
**Date:** 2026-04-26

## Summary

Replace the entire authenticated dashboard with a single full-screen "incubating" holding page while the real dashboard is under development. Authenticated users land here after sign-in. No navigation is shown. The page communicates that their BirdBot is being built and they'll be notified when it's ready.

## Approach

Option A: gut the existing dashboard layout and replace the main page, leaving all sub-page files intact but unreachable.

## Layout

- `dashboard/layout.tsx` becomes a bare full-screen wrapper: `min-h-screen bg-depth flex items-center justify-center`
- No Sidebar, MobileHeader, BottomTabBar, SettingsModal, AccountModal, or WizardProvider
- `dashboard/page.tsx` renders the incubating content directly (no redirect)
- New `dashboard/[...slug]/page.tsx` catch-all redirects any direct `/dashboard/*` URL back to `/dashboard`

## Content

Vertical stack, centered both axes:

1. 🥚 emoji — `text-8xl` (~96px), noticeable
2. Heading — `"Your Birdbot is Incubating"` — `font-heading` (Outfit), large, `text-text-base`
3. Subtext — `"We'll notify you when it's hatched."` — `text-text-dim`, smaller

## Animation

CSS-only keyframe `egg-shake` added to `custom.css` (not `globals.css`):

- Keyframes: `0%,85%,100% { transform: translateX(0) rotate(0deg) }` with ±4–6px lateral wobble + slight rotation in the middle frames
- Total `animation-duration: 3.5s`, `animation-iteration-count: infinite`
- Motion occupies only the first ~15% of the cycle — egg sits still for ~3s, then shakes for ~0.5s, repeating

## Files Changed

| File | Change |
|------|--------|
| `src/app/dashboard/layout.tsx` | Gutted to bare centered wrapper |
| `src/app/dashboard/page.tsx` | Incubating page content |
| `src/app/dashboard/[...slug]/page.tsx` | New — catch-all redirect to `/dashboard` |
| `src/app/custom.css` | Add `@keyframes egg-shake` and `.egg-shake` class |

## Non-Goals

- No email capture (user is already authenticated via Clerk)
- No changes to existing sub-page files (goals, integrations, memory, settings) — preserved for future use
- No changes to landing page, sign-in, or sign-up flows
