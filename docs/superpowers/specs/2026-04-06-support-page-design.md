# Support Page — Design Spec

**Date:** 2026-04-06
**Status:** Approved

---

## Overview

Add a public Support page at `/support`, accessible via the Footer. The page is a static Next.js route styled to match the app's dark aesthetic. It displays an animated GIF, a heading, subtext, and an email address box with copy and open-mail actions.

The Footer's "Contact" label is also renamed to "Support" and re-routed to `/support`.

---

## Approach

Static Next.js page (`.tsx`) as a server component (shell), with a small `"use client"` component for the copy-to-clipboard button. Mirrors Privacy/Terms pages in shell structure — same Navbar, Footer, and star background pattern.

---

## Page Design

- **Route:** `/support`
- **File:** `src/app/support/page.tsx`
- **Style:** Dark-themed, full-width page. Single centered column, max-width `max-w-md`, vertically centered content using flex.
- **Root wrapper:** `<div className="min-h-screen">` — no `bg-depth`, so the globally-rendered `StarField` shows through (same pattern as Privacy and Terms pages).

---

## Layout

Content is centered both horizontally and vertically within the viewport (accounting for navbar height):

```
[Navbar]

  [GIF — 200px wide, centered]
  [Heading: "Get Support"]
  [Subtext: "Have a question or ran into an issue? Drop us a line and we'll get back to you."]
  [Email box: support@birdbot.ai  [copy icon]  [open-mail icon]]

[Footer]
```

---

## Content

- **Heading:** "Get Support"
  - `font-heading font-bold text-text-base`, `fontSize: clamp(1.6rem, 4vw, 2.25rem)`
- **Subtext:** "Have a question or ran into an issue? Drop us a line and we'll get back to you."
  - `text-sm font-sans text-text-dim leading-relaxed`
- **GIF:** `public/download (1).gif`, rendered via Next.js `<Image>` component, ~200px wide, centered above the heading

---

## Email Box

A styled row showing the email address with two icon buttons:

- **Style:** `rounded-xl border border-border bg-panel px-4 py-3 flex items-center justify-between gap-4`
- **Email text:** `support@birdbot.ai` — `text-sm font-sans text-text-base`
- **Copy button:**
  - Uses `navigator.clipboard.writeText("support@birdbot.ai")`
  - On success: icon swaps to a checkmark for 2 seconds, then reverts to copy icon
  - Requires `"use client"` — implemented as a self-contained `EmailBox` client component in the same file (or a separate file)
  - Icon: clipboard SVG (copy state) / checkmark SVG (copied state)
- **Open mail button:**
  - `<a href="mailto:support@birdbot.ai">` — opens user's default email client
  - Icon: external-link or envelope SVG

---

## Footer Change

- **File:** `src/components/landing/Footer.tsx`
- **Change:** Rename "Contact" → "Support" in the labels array, update `FOOTER_HREFS["Support"] = "/support"`, remove `FOOTER_HREFS["Contact"]`

---

## Architecture

Two changes:

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/app/support/page.tsx` | Full Support page — shell (server component) + `EmailBox` client component |
| Modify | `src/components/landing/Footer.tsx` | Rename "Contact" → "Support", route to `/support` |

The `EmailBox` client component lives inside `src/app/support/page.tsx` (exported as a named component at the bottom of the file, or inline). It is the only interactive piece; the rest of the page is a server component.

---

## Out of Scope

- Contact form / ticketing system
- Live chat widget
- FAQ section
- Dashboard support page changes (`/dashboard/support` — separate concern)
