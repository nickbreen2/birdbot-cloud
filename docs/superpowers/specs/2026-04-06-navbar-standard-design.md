# Navbar: Pill → Standard Design

**Date:** 2026-04-06  
**File:** `src/components/landing/Navbar.tsx`

## Overview

Switch the landing page navbar from a floating glass pill to a standard full-width bar pinned to the top of the viewport. The goal is a cleaner, more conventional SaaS appearance.

## Desktop Changes

- **Layout:** Remove `mx-4 mt-3` side/top margins. The bar spans the full viewport width, flush to all edges.
- **Border radius:** Remove `rounded-2xl`. Bar is square-edged.
- **Background:** Solid `#0a0e1a` (fully opaque). Remove `backdropFilter` and `WebkitBackdropFilter` blur — not needed with an opaque background.
- **Bottom edge:** `1px solid #1e2a45` (existing `border-border` token). No drop shadow.
- **Everything else unchanged:** Logo, nav links, desktop Sign In / Get Started / Dashboard / Sign Out buttons stay exactly as they are.

## Mobile Menu Changes

- **Layout:** Full-width dropdown directly below the navbar. Remove `mx-3 sm:mx-4` side margins and `rounded-2xl` border radius.
- **Background:** Solid `#0a0e1a` (match navbar, no blur needed).
- **Bottom edge:** `1px solid #1e2a45` to separate from page content.
- **Nav links:** Keep as-is (text, hover styles, divider).
- **Auth buttons — stacked layout:**
  - Sign In: full-width, ghost style with `1px solid #1e2a45` border
  - Get Started: full-width, solid blue CTA (existing `Button` component with `className="w-full justify-center"`)
  - Both stacked vertically in a `flex-col gap-2` container

## What Does Not Change

- Logo image, size, and link
- Desktop nav link labels, hrefs, colors, hover states
- Desktop CTA button styles (Sign In text button, Get Started Button component, Dashboard button, Sign Out)
- Hamburger button appearance and behavior
- AuthModal integration
- All Clerk auth logic (`useAuth`, `SignOutButton`)
- Tailwind color tokens and font classes used inside the bar

## Out of Scope

- Scroll-triggered behavior (transparent → solid)
- Any changes to other pages or components
- Animation or transition on mobile menu open/close
