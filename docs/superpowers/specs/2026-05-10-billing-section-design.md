# Billing Section in Account Modal

**Date:** 2026-05-10  
**Status:** Approved

## Overview

Add a Billing section to the existing Account modal (`AccountModal.tsx`) so users can see their plan, subscription status, trial end date, and cancel or manage their subscription. The Stripe Customer Portal handles all billing actions (cancel, update card, view invoices) via a server-generated redirect URL.

## What We're Building

1. **Backend** — `/api/billing-portal` route: looks up the user's `stripeCustomerId` in Prisma, creates a Stripe Billing Portal session, returns the URL.
2. **Frontend** — A new `"billing"` section in `AccountModal.tsx`: added to the left sidebar nav between Security and Danger Zone, with a right-panel content component that shows plan info and a "Manage subscription" button.

## Architecture

### Backend: `/api/billing-portal` (POST)

- Auth: `auth()` from Clerk — return 401 if no session
- Look up `Subscription` record in Prisma by `clerkUserId`; return 404 if none found
- Call `stripe.billingPortal.sessions.create({ customer: stripeCustomerId, return_url: <dashboard URL> })`
- Return `{ url }` — the frontend redirects to it

Return URL: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` (user lands back on dashboard after portal actions).

### Frontend: Billing section in AccountModal

**Nav change:** `AccountSection` type gains `"billing"`. The sidebar renders `["profile", "security", "billing"]` in the main nav, with Danger Zone remaining in the footer slot (unchanged).

**`SECTION_META` addition:**
```
billing: { title: "Billing", subtitle: "Manage your subscription, plan, and payment method." }
```

**`BillingSection` component** (new, lives in `AccountModal.tsx`):
- On mount: fetches `/api/billing-portal` (POST) to get the portal URL — stores it in state
- Shows three info rows (matching the existing card style used across the modal):
  - **Plan** — e.g. "Monthly · $9 / mo" or "Annual · $60 / yr" (read from `Prisma.Subscription.stripePriceId`, mapped to display label)
  - **Status** — green "Trial" badge if `subscription.status === "trialing"`, otherwise "Active"
  - **Trial ends / Next billing** — formatted date from `subscription.currentPeriodEnd`
- "Manage subscription" button — on click, `window.open(portalUrl, "_blank")` (opens Stripe portal in new tab)
- Small hint line beneath button: "Cancel anytime · Opens Stripe's secure billing portal"
- Loading state while portal URL is fetching; error state if fetch fails ("Unable to load billing info. Please try again.")

**Data source for plan info:** A new `/api/billing-info` GET route returns `{ plan, status, currentPeriodEnd }` derived from the user's `Prisma.Subscription` record. This keeps billing data server-side rather than exposing Stripe IDs to the client.

## Data Flow

```
BillingSection mounts
  → GET /api/billing-info      → Prisma.Subscription → { plan, status, periodEnd }
  → POST /api/billing-portal   → Stripe Portal Session → { url }

User clicks "Manage subscription"
  → window.open(portalUrl, "_blank")
  → Stripe portal (cancel / update card / invoices)
  → User returns to /dashboard (return_url)
  → Stripe webhook fires → handleStripeSubscriptionUpdated task updates Prisma
```

## Error Handling

- If user has no subscription record in Prisma: show "No active subscription found." with a support email link
- If Stripe API call fails: show "Unable to load billing info. Please try again." with a retry button
- Loading state on both fetches with a spinner replacing the action button

## What We're Not Changing

- `dashboard/settings/page.tsx` — left as-is for now (Anthropic API key cleanup is a separate task)
- Stripe webhook handler — already handles subscription updates/cancellations correctly
- Onboarding flow — untouched

## Files Touched

| File | Change |
|------|--------|
| `src/app/api/billing-portal/route.ts` | New — creates Stripe portal session |
| `src/app/api/billing-info/route.ts` | New — returns plan/status/periodEnd for display |
| `src/components/dashboard/AccountModal.tsx` | Add `"billing"` to `AccountSection` type, sidebar nav, `SECTION_META`, and new `BillingSection` component |
