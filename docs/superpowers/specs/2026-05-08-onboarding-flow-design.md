# BirdBot Onboarding Flow — Design Spec
**Date:** 2026-05-08  
**Author:** Nick Breen  
**Status:** Approved — ready for implementation

---

## Overview

A 3-step onboarding wizard for new BirdBot users, followed by a welcome popup on the dashboard. The flow uses a consistent split-screen layout (50/50) throughout, inspired by Lindy.ai's onboarding aesthetic. All mockups are in `.superpowers/brainstorm/51770-1778278778/content/`.

---

## Visual Design System

All steps share these tokens:

| Token | Value |
|---|---|
| Font — headings | Bricolage Grotesque, 700 |
| Font — body | DM Sans, 400/500/600 |
| Blue accent | `#2463EB` |
| Text primary | `#0D0D0D` |
| Text muted | `#888882` |
| Border | `#EBEBEA` |
| Right panel bg | `#F5F4F0` |
| Demo card bg | `#ECEAE4` |
| Left padding | `0 148px` |
| Progress bar | `flex:1` segments, 3px height, full content width |
| Button | `height: 48px`, `border-radius: 13px`, `#2463EB` |

Progress bar segment states: `done` (blue, 45% opacity) → `on` (full blue) → inactive (grey).

---

## Route Structure

```
/onboarding          → Step 1 (platform picker)
/onboarding/connect  → Step 2 (Google OAuth)
/onboarding/plan     → Step 3 (Stripe paywall)
/dashboard           → Post-onboarding (welcome popup on first visit)
```

Guard: If a user navigates directly to `/dashboard` without completing onboarding, redirect to `/onboarding`. Track completion state in the Clerk user's `publicMetadata` (`onboardingComplete: true`).

---

## Step 1 — Pick a Home
**Mockup:** `step1-v4.html`

**Left panel:**
- BirdBot brand mark + name
- Progress bar (step 1 active, 2 & 3 dim)
- H1: "Pick a home for your BirdBot" (44px Bricolage Grotesque)
- Subtitle: "Choose where Bird will reach you. More platforms are coming soon."
- 3 square platform cards in a row (fixed height 136px):
  - **Telegram** — active/selectable, shows checkmark when selected
  - **WhatsApp** — disabled, "Soon" badge
  - **iMessage** — disabled, "Soon" badge
- "Continue →" button (only enabled when a platform is selected; Telegram pre-selected)

**Right panel:**
- `#F5F4F0` background, `#ECEAE4` demo card, grain texture overlay
- Orbit animation: 3 concentric rings (136/236/340px), BirdBot logo at center
  - Inner orbit (9s CW): Telegram icon
  - Middle orbit (15s CW): Gmail + Google Calendar (180° apart)
  - Outer orbit (21s CCW): Google Drive

**On continue:** Save selected platform to Clerk `publicMetadata.platform`. Navigate to `/onboarding/connect`.

---

## Step 2 — Connect Google
**Mockup:** `step2-layout.html`

**Left panel:**
- Brand + progress (step 1 done, step 2 active, step 3 dim)
- H1: "Get the most out of BirdBot / by connecting your essentials" (`<br>` between lines)
- Subtitle: "Connect your email and calendar so BirdBot can prioritize what matters, draft replies in your voice, and keep your schedule on track."
- 3 access items with brand SVG icons:
  - Gmail — "Label & organize your emails, draft replies in your voice"
  - Google Calendar — "Handle your schedule, book meetings, track what's coming up"
  - Google Drive — "Access your Drive files when you need to reference or share them"
- "Connect Google" button (Google G logo + text) → triggers Google OAuth
- "Skip for now" text link below button

**Right panel:** Same orbit card as Step 1.

**On connect:** Google OAuth redirect. On callback, store tokens (existing `/api/auth/google` flow). Navigate to `/onboarding/plan`.  
**On skip:** Navigate to `/onboarding/plan` without storing tokens. User can connect later from dashboard settings.

---

## Step 3 — Paywall
**Mockup:** `step3-layout.html`

**Left panel:**
- Brand + progress (steps 1 & 2 done, step 3 active)
- H1: "Start your / 7-day free trial" (44px, `<br>` between lines, non-breaking hyphen in "7‑day")
- Subtitle: "No charge until your trial ends. Cancel anytime, no questions asked."
- Plan toggle (Monthly `$9/mo` | Annual `$60/yr` · Save 44%) — interactive, updates price shown on right card
- 4 benefit items with checkmarks:
  1. Handle your schedule & book meetings
  2. Label, organize & draft email replies in your voice
  3. Keep up on what's on your plate
  4. Unlimited texts & memory storage
- "Start free trial →" button → submits payment
- Fine print: Terms & Privacy Policy links

**Right panel:** White Stripe-style payment card on warm background.
- Header: BirdBot Pro logo + plan name + price (updates with toggle)
- Fields: Card number, Expiry date, Security code, Cardholder name
- "Due today: $0.00" (green)
- "Start free trial" CTA button
- "Secured & powered by Stripe" badge

**Implementation:** Use Stripe Elements (not Stripe Checkout redirect) so the form is embedded in the right panel. On success, mark `publicMetadata.onboardingComplete = true`, set `publicMetadata.plan = 'monthly' | 'annual'`. Navigate to `/dashboard`.

---

## Welcome Popup
**Mockup:** `welcome-popup.html`

Shown once on first `/dashboard` load after `onboardingComplete` is set. Dismissed by clicking "Take me to my dashboard →" or the ✕ close button. Store `hasSeenWelcome: true` in localStorage so it never shows again.

**Design:** Centered modal with blurred backdrop over the dashboard.
- "YOU'RE ALL SET" eyebrow (blue, uppercase)
- H2: "Welcome — here's what I can do for you"
- Subtitle: "Bird is ready to go. Here's a quick look at what you've unlocked."
- 4 capability cards:
  1. Handle your schedule
  2. Label, organize & draft email replies
  3. Keep up on what's on your plate
  4. Unlimited texts & memory
- "Take me to my dashboard →" primary CTA

---

## State & Guards

| State | Storage | Notes |
|---|---|---|
| `platform` | Clerk `publicMetadata` | Set on Step 1 completion |
| `googleConnected` | Clerk `publicMetadata` | Set after OAuth success |
| `onboardingComplete` | Clerk `publicMetadata` | Set after Stripe success |
| `hasSeenWelcome` | `localStorage` | Prevents popup from re-appearing |

Onboarding guard middleware: check `onboardingComplete` in `middleware.ts`. If false and route is `/dashboard/*`, redirect to `/onboarding`.

---

## Out of Scope (this sprint)

- WhatsApp and iMessage integrations (cards are disabled with "Soon" badge)
- Dashboard settings page for post-onboarding Google connect
- `/pricing` landing page (separate sprint)
