# Billing Section in Account Modal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Billing section to the Account modal so users can see their plan, subscription status, trial/billing date, and open Stripe's portal to cancel or update payment.

**Architecture:** Two new API routes serve plan display data and a Stripe Customer Portal session URL. A new `BillingSection` component inside `AccountModal.tsx` fetches both on mount and renders info rows + a "Manage subscription" button. All billing actions (cancel, update card, invoices) happen inside Stripe's hosted portal.

**Tech Stack:** Next.js App Router API routes, Clerk (`auth()`), Prisma (`Subscription` model), Stripe SDK (`billingPortal.sessions.create`), React (`useState`, `useEffect`), Vitest

---

## File Map

| File | Action |
|------|--------|
| `src/app/api/billing-info/route.ts` | **Create** — GET, returns `{ plan, status, currentPeriodEnd }` |
| `src/app/api/billing-portal/route.ts` | **Create** — POST, returns `{ url }` for Stripe portal |
| `src/components/dashboard/AccountModal.tsx` | **Modify** — add `"billing"` section type, nav items, `BillingSection` component |
| `src/__tests__/api/billing/billing-info.test.ts` | **Create** — tests for `resolvePlanLabel` pure function |
| `src/__tests__/api/billing/billing-portal.test.ts` | **Create** — tests for `resolveCustomerId` pure function |

---

## Task 1: `GET /api/billing-info`

**Files:**
- Create: `src/app/api/billing-info/route.ts`
- Create: `src/__tests__/api/billing/billing-info.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/api/billing/billing-info.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { PLANS } from '@/lib/stripe'

// Pure function extracted from route — testable without HTTP
function resolvePlanLabel(stripePriceId: string): string {
  if (stripePriceId === PLANS.monthly.priceId) return 'Monthly · $9 / mo'
  if (stripePriceId === PLANS.annual.priceId)  return 'Annual · $60 / yr'
  return 'BirdBot Pro'
}

describe('resolvePlanLabel', () => {
  it('returns monthly label for monthly price ID', () => {
    expect(resolvePlanLabel(PLANS.monthly.priceId)).toBe('Monthly · $9 / mo')
  })

  it('returns annual label for annual price ID', () => {
    expect(resolvePlanLabel(PLANS.annual.priceId)).toBe('Annual · $60 / yr')
  })

  it('returns fallback label for unknown price ID', () => {
    expect(resolvePlanLabel('price_unknown_xyz')).toBe('BirdBot Pro')
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npm test -- billing-info
```

Expected: FAIL — `resolvePlanLabel is not defined`

- [ ] **Step 3: Create the route with the exported function**

Create `src/app/api/billing-info/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { PLANS } from '@/lib/stripe'

export function resolvePlanLabel(stripePriceId: string): string {
  if (stripePriceId === PLANS.monthly.priceId) return 'Monthly · $9 / mo'
  if (stripePriceId === PLANS.annual.priceId)  return 'Annual · $60 / yr'
  return 'BirdBot Pro'
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sub = await prisma.subscription.findUnique({ where: { clerkUserId: userId } })
  if (!sub) return NextResponse.json({ error: 'No subscription found' }, { status: 404 })

  return NextResponse.json({
    plan: resolvePlanLabel(sub.stripePriceId),
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
  })
}
```

Update the test import to use the route:

```ts
import { describe, it, expect } from 'vitest'
import { resolvePlanLabel } from '@/app/api/billing-info/route'

describe('resolvePlanLabel', () => {
  it('returns monthly label for monthly price ID', () => {
    const { PLANS } = require('@/lib/stripe')
    expect(resolvePlanLabel(PLANS.monthly.priceId)).toBe('Monthly · $9 / mo')
  })

  it('returns annual label for annual price ID', () => {
    const { PLANS } = require('@/lib/stripe')
    expect(resolvePlanLabel(PLANS.annual.priceId)).toBe('Annual · $60 / yr')
  })

  it('returns fallback label for unknown price ID', () => {
    expect(resolvePlanLabel('price_unknown_xyz')).toBe('BirdBot Pro')
  })
})
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
npm test -- billing-info
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/billing-info/route.ts src/__tests__/api/billing/billing-info.test.ts
git commit -m "feat: add GET /api/billing-info route"
```

---

## Task 2: `POST /api/billing-portal`

**Files:**
- Create: `src/app/api/billing-portal/route.ts`
- Create: `src/__tests__/api/billing/billing-portal.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/api/billing/billing-portal.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

// Pure function extracted from route — validates customer ID is a non-empty string
function resolveCustomerId(stripeCustomerId: unknown): string | null {
  if (typeof stripeCustomerId === 'string' && stripeCustomerId.length > 0) {
    return stripeCustomerId
  }
  return null
}

describe('resolveCustomerId', () => {
  it('returns the customer ID when valid', () => {
    expect(resolveCustomerId('cus_abc123')).toBe('cus_abc123')
  })

  it('returns null for empty string', () => {
    expect(resolveCustomerId('')).toBeNull()
  })

  it('returns null for non-string', () => {
    expect(resolveCustomerId(null)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npm test -- billing-portal
```

Expected: FAIL — `resolveCustomerId is not defined`

- [ ] **Step 3: Create the route with the exported function**

Create `src/app/api/billing-portal/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export function resolveCustomerId(stripeCustomerId: unknown): string | null {
  if (typeof stripeCustomerId === 'string' && stripeCustomerId.length > 0) {
    return stripeCustomerId
  }
  return null
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sub = await prisma.subscription.findUnique({ where: { clerkUserId: userId } })
  if (!sub) return NextResponse.json({ error: 'No subscription found' }, { status: 404 })

  const customerId = resolveCustomerId(sub.stripeCustomerId)
  if (!customerId) return NextResponse.json({ error: 'Invalid customer' }, { status: 500 })

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/dashboard`,
  })

  return NextResponse.json({ url: session.url })
}
```

Update the test import to use the route:

```ts
import { describe, it, expect } from 'vitest'
import { resolveCustomerId } from '@/app/api/billing-portal/route'

describe('resolveCustomerId', () => {
  it('returns the customer ID when valid', () => {
    expect(resolveCustomerId('cus_abc123')).toBe('cus_abc123')
  })

  it('returns null for empty string', () => {
    expect(resolveCustomerId('')).toBeNull()
  })

  it('returns null for non-string', () => {
    expect(resolveCustomerId(null)).toBeNull()
  })
})
```

- [ ] **Step 4: Run test — confirm it passes**

```bash
npm test -- billing-portal
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/billing-portal/route.ts src/__tests__/api/billing/billing-portal.test.ts
git commit -m "feat: add POST /api/billing-portal route"
```

---

## Task 3: Billing section in `AccountModal.tsx`

**Files:**
- Modify: `src/components/dashboard/AccountModal.tsx`

This task has no unit-testable pure functions — it's a UI wiring change. Verify manually at the end.

### 3a — Extend the type and metadata

- [ ] **Step 1: Update `AccountSection` type and `SECTION_META`**

In `AccountModal.tsx`, find:

```ts
type AccountSection = "profile" | "security" | "danger"

const SECTION_META: Record<AccountSection, { title: string; subtitle: string }> = {
  profile:  { title: "Profile",  subtitle: "Manage your profile, email, and connected accounts." },
  security: { title: "Security", subtitle: "View and manage your active sessions." },
  danger:   { title: "Danger Zone", subtitle: "Irreversible actions. Proceed with caution." },
}
```

Replace with:

```ts
type AccountSection = "profile" | "security" | "billing" | "danger"

const SECTION_META: Record<AccountSection, { title: string; subtitle: string }> = {
  profile:  { title: "Profile",  subtitle: "Manage your profile, email, and connected accounts." },
  security: { title: "Security", subtitle: "View and manage your active sessions." },
  billing:  { title: "Billing",  subtitle: "Manage your subscription, plan, and payment method." },
  danger:   { title: "Danger Zone", subtitle: "Irreversible actions. Proceed with caution." },
}
```

### 3b — Add Billing to the desktop sidebar nav

- [ ] **Step 2: Add "billing" to the desktop sidebar nav array**

In `AccountModal.tsx`, find the desktop sidebar nav (around line 143):

```tsx
{(["profile", "security"] as const).map((id) => (
```

Replace with:

```tsx
{(["profile", "security", "billing"] as const).map((id) => (
```

### 3c — Add Billing to the mobile nav overlay

- [ ] **Step 3: Add "billing" to the mobile nav overlay array**

In `AccountModal.tsx`, find the mobile nav overlay (around line 91):

```tsx
{(["profile", "security"] as const).map((id) => (
```

Replace with:

```tsx
{(["profile", "security", "billing"] as const).map((id) => (
```

### 3d — Fix nav item labels for the new section

Both nav maps currently render the label as `id === "profile" ? "Profile" : "Security"`. That needs to handle all three sections now.

- [ ] **Step 4: Update label rendering in desktop nav**

In the desktop sidebar nav, find the button text inside the `.map()`:

```tsx
{id === "profile" ? "Profile" : "Security"}
```

Replace with:

```tsx
{id === "profile" ? "Profile" : id === "security" ? "Security" : "Billing"}
```

- [ ] **Step 5: Update label rendering in mobile nav**

In the mobile nav overlay, find the same pattern and apply the same replacement:

```tsx
{id === "profile" ? "Profile" : "Security"}
```

Replace with:

```tsx
{id === "profile" ? "Profile" : id === "security" ? "Security" : "Billing"}
```

### 3e — Wire up section rendering

- [ ] **Step 6: Add `BillingSection` to the content render block**

In the scrollable content area (around line 214), find:

```tsx
{section === "security" && <SecuritySection />}
{section === "danger" && (
```

Replace with:

```tsx
{section === "security" && <SecuritySection />}
{section === "billing" && <BillingSection />}
{section === "danger" && (
```

### 3f — Add the `BillingSection` component

- [ ] **Step 7: Add `BillingSection` at the bottom of the file, before the closing `}`**

Add this entire component after the `DangerSection` function:

```tsx
// ── Billing section ────────────────────────────────────────────────────────────

type BillingInfo = { plan: string; status: string; currentPeriodEnd: string }

function BillingSection() {
  const [info, setInfo] = useState<BillingInfo | null>(null)
  const [portalUrl, setPortalUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [noSubscription, setNoSubscription] = useState(false)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    setNoSubscription(false)

    async function load() {
      try {
        const [infoRes, portalRes] = await Promise.all([
          fetch('/api/billing-info'),
          fetch('/api/billing-portal', { method: 'POST' }),
        ])
        if (cancelled) return
        if (infoRes.status === 404 || portalRes.status === 404) {
          setNoSubscription(true)
          return
        }
        if (!infoRes.ok || !portalRes.ok) { setError(true); return }
        const infoData = await infoRes.json() as BillingInfo
        const portalData = await portalRes.json() as { url: string }
        setInfo(infoData)
        setPortalUrl(portalData.url)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [retryCount])

  const periodEnd = info
    ? new Date(info.currentPeriodEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const isTrialing = info?.status === 'trialing'

  if (loading) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-7 flex items-center justify-center h-40">
        <span className="text-sm text-text-muted">Loading billing info…</span>
      </div>
    )
  }

  if (noSubscription) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-7 flex flex-col gap-3">
        <p className="text-sm text-text-muted">No active subscription found.</p>
        <p className="text-xs text-text-muted">
          Need help?{' '}
          <a href="mailto:support@birdbot.ai" className="underline hover:text-text-dim transition-colors">
            Contact support
          </a>
        </p>
      </div>
    )
  }

  if (error || !info || !portalUrl) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-7 flex flex-col gap-3">
        <p className="text-sm text-text-muted">Unable to load billing info. Please try again.</p>
        <button
          type="button"
          onClick={() => setRetryCount(c => c + 1)}
          className="text-xs text-text-dim hover:text-text-base border border-border px-3 py-1.5 rounded-lg transition-colors w-fit"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-7 flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold font-sans text-text-muted uppercase tracking-widest">
          Subscription
        </p>

        {/* Plan */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl"
          style={{ background: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}
        >
          <span className="text-sm text-text-muted">Plan</span>
          <span className="text-sm font-semibold text-text-base">{info.plan}</span>
        </div>

        {/* Status */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl"
          style={{ background: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}
        >
          <span className="text-sm text-text-muted">Status</span>
          {isTrialing ? (
            <span
              className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full"
              style={{
                color: "#34d399",
                background: "rgba(5,150,105,0.12)",
                border: "1px solid rgba(5,150,105,0.28)",
              }}
            >
              Trial
            </span>
          ) : (
            <span
              className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full"
              style={{
                color: "#4ade80",
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
              }}
            >
              Active
            </span>
          )}
        </div>

        {/* Trial end / Next billing */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl"
          style={{ background: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}
        >
          <span className="text-sm text-text-muted">
            {isTrialing ? "Trial ends" : "Next billing"}
          </span>
          <span className="text-sm font-semibold text-text-base">{periodEnd}</span>
        </div>

        {/* Manage button */}
        <button
          type="button"
          onClick={() => window.open(portalUrl, "_blank")}
          className="w-full h-10 rounded-xl text-sm font-semibold transition-colors mt-1"
          style={{
            background: "rgba(36,99,235,0.10)",
            border: "1px solid rgba(36,99,235,0.28)",
            color: "#93b4f8",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(36,99,235,0.18)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(36,99,235,0.10)"
          }}
        >
          Manage subscription
        </button>

        <p className="text-center text-[11.5px] font-sans" style={{ color: "#334155" }}>
          Cancel anytime · Opens Stripe&apos;s secure billing portal
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Run the full test suite to make sure nothing broke**

```bash
npm test
```

Expected: All tests pass

- [ ] **Step 9: Start the dev server and verify manually**

```bash
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard), open the Account modal, click **Billing** in the left sidebar. Verify:

1. Plan, Status, and date rows render correctly
2. Status shows "Trial" badge (green) if in trial, "Active" if not
3. "Manage subscription" button opens Stripe portal in a new tab
4. Closing the portal and returning to `/dashboard` works
5. Click through Profile, Security, and Danger Zone — confirm they're unchanged

- [ ] **Step 10: Commit**

```bash
git add src/components/dashboard/AccountModal.tsx
git commit -m "feat: add Billing section to Account modal with Stripe portal link"
```
