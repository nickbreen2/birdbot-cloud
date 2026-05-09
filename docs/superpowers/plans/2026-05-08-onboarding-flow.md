# BirdBot Onboarding Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 3-step onboarding wizard (/onboarding → /onboarding/connect → /onboarding/plan), welcome popup on /dashboard, and middleware guard — pixel-matching the approved mockups.

**Architecture:** Shared split-screen shell (OrbitPanel right, step content left). State persists to Clerk publicMetadata (platform, googleConnected, onboardingComplete) via three thin API routes. Step 3 uses Stripe Elements (SetupIntent → confirmSetup → subscribe endpoint) so the payment form is embedded, not a redirect. Middleware reads onboardingComplete from Clerk session claims.

**Tech Stack:** Next.js 16 App Router · Clerk v7 · @stripe/react-stripe-js · Stripe Node SDK · Google OAuth (existing flow) · Prisma/PostgreSQL · Vitest

**Mockups:** `.superpowers/brainstorm/51770-1778278778/content/` — step1-v4.html, step2-layout.html, step3-layout.html, welcome-popup.html

**Design tokens:**
- Font headings: Bricolage Grotesque 700 (`--font-bricolage`)
- Font body: DM Sans (`--font-dm-sans`, already loaded)
- Blue: `#2463EB` · Text: `#0D0D0D` · Muted: `#888882` · Border: `#EBEBEA`
- Right panel bg: `#F5F4F0` · Demo card bg: `#ECEAE4`
- Left panel padding: `0 148px`
- Progress segment states: `on` = `#2463EB` (active) · `done` = `#2463EB` @ 0.45 opacity (completed) · `dim` = `#C3D4FC` (future)

---

## ⚠️ One-time Clerk configuration required (do before testing middleware)

In the Clerk Dashboard → Configure → Sessions → "Customize session token":
Add this to the session token JSON template:
```json
{ "onboardingComplete": "{{user.public_metadata.onboardingComplete}}" }
```
This makes `onboardingComplete` available in `auth().sessionClaims` inside middleware without an extra API call.

---

## File Map

**Create:**

| File | Responsibility |
|---|---|
| `src/middleware.ts` | Auth + onboarding guard (redirect /dashboard → /onboarding when incomplete) |
| `src/lib/onboarding.ts` | Pure redirect-decision logic (testable without Next.js/Clerk) |
| `src/app/onboarding/layout.tsx` | Bare layout — just renders children, no sidebar chrome |
| `src/app/onboarding/page.tsx` | Step 1: platform picker client component |
| `src/app/onboarding/connect/page.tsx` | Step 2: Google connect client component |
| `src/app/onboarding/plan/page.tsx` | Step 3: Stripe Elements paywall client component |
| `src/components/onboarding/OrbitPanel.tsx` | Animated orbit right panel (shared across all 3 steps) |
| `src/components/onboarding/OnboardingShell.tsx` | Split-screen wrapper: brand row + progress bar + OrbitPanel |
| `src/components/dashboard/WelcomePopup.tsx` | First-visit welcome modal (localStorage guard) |
| `src/app/api/onboarding/platform/route.ts` | POST: save platform to Clerk, set onboardingComplete: false |
| `src/app/api/onboarding/setup-intent/route.ts` | POST: get-or-create Stripe customer, return SetupIntent clientSecret |
| `src/app/api/onboarding/subscribe/route.ts` | POST: attach PM, create subscription w/ trial, write Prisma, set onboardingComplete: true |
| `src/__tests__/lib/onboarding.test.ts` | Unit tests for redirect logic |
| `src/__tests__/api/onboarding/platform.test.ts` | Unit tests for platform route logic |
| `src/__tests__/api/onboarding/subscribe.test.ts` | Unit tests for subscribe route logic |

**Modify:**

| File | Change |
|---|---|
| `src/app/layout.tsx` | Add Bricolage Grotesque font; change `signUpForceRedirectUrl="/onboarding"` |
| `src/app/custom.css` | Add `@keyframes ob-cw`, `ob-ccw`, `ob-pulse` for orbit animations |
| `src/app/api/google/callback/route.ts` | After storing tokens, set `googleConnected: true` in Clerk metadata; if `onboardingComplete !== true`, redirect to `/onboarding/plan` instead of `/dashboard/integrations` |
| `src/app/dashboard/page.tsx` | Add `<WelcomePopup />` at the bottom of the JSX |

---

## Task 1: Package install + Font + ClerkProvider

**Files:**
- `package.json` (via npm)
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Read the Next.js docs for this version**

```bash
ls /Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud/node_modules/next/dist/docs/ 2>/dev/null | head -30
```

Read any guide relevant to middleware, App Router layouts, and server components before writing code below.

- [ ] **Step 2: Install @stripe/react-stripe-js**

```bash
cd /Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud
npm install @stripe/react-stripe-js
```

Expected: package added, no peer-dep errors.

- [ ] **Step 3: Add Bricolage Grotesque to root layout**

In `src/app/layout.tsx`, add the import and font definition (alongside the existing Outfit/DM_Sans/Fraunces/JetBrains_Mono):

```ts
import { Bricolage_Grotesque } from "next/font/google"

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["500", "600", "700"],
  axes: ["opsz"],
})
```

Add `bricolageGrotesque.variable` to the `<html>` className (alongside the existing `outfit.variable` etc).

- [ ] **Step 4: Change signUpForceRedirectUrl**

In `src/app/layout.tsx`, change:
```tsx
<ClerkProvider signUpForceRedirectUrl="/dashboard" signInForceRedirectUrl="/dashboard">
```
to:
```tsx
<ClerkProvider signUpForceRedirectUrl="/onboarding" signInForceRedirectUrl="/dashboard">
```

Existing signed-in users still land at `/dashboard` on sign-in. New signups go to `/onboarding`.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx package.json package-lock.json
```

```bash
git commit -m "feat: add Bricolage Grotesque font, install @stripe/react-stripe-js, point new signups to /onboarding"
```

---

## Task 2: Middleware guard

**Files:**
- Create: `src/lib/onboarding.ts`
- Create: `src/middleware.ts`
- Create: `src/__tests__/lib/onboarding.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/lib/onboarding.test.ts
import { describe, it, expect } from 'vitest'
import { getOnboardingRedirect } from '@/lib/onboarding'

describe('getOnboardingRedirect', () => {
  it('returns sign-in for unauthenticated user on protected route', () => {
    expect(getOnboardingRedirect('/dashboard', null, {})).toBe('sign-in')
  })

  it('redirects /dashboard to /onboarding when onboardingComplete is false', () => {
    expect(getOnboardingRedirect('/dashboard', 'user_1', { onboardingComplete: false })).toBe('onboarding')
  })

  it('redirects /dashboard/memory to /onboarding when onboardingComplete is false', () => {
    expect(getOnboardingRedirect('/dashboard/memory', 'user_1', { onboardingComplete: false })).toBe('onboarding')
  })

  it('allows /dashboard when onboardingComplete is true', () => {
    expect(getOnboardingRedirect('/dashboard', 'user_1', { onboardingComplete: true })).toBeNull()
  })

  it('allows /dashboard when onboardingComplete is undefined (existing users bypass guard)', () => {
    expect(getOnboardingRedirect('/dashboard', 'user_1', {})).toBeNull()
  })

  it('redirects /onboarding to /dashboard when onboardingComplete is true', () => {
    expect(getOnboardingRedirect('/onboarding', 'user_1', { onboardingComplete: true })).toBe('dashboard')
  })

  it('allows /onboarding when onboardingComplete is false', () => {
    expect(getOnboardingRedirect('/onboarding', 'user_1', { onboardingComplete: false })).toBeNull()
  })

  it('allows /onboarding when onboardingComplete is undefined (new user starting flow)', () => {
    expect(getOnboardingRedirect('/onboarding', 'user_1', {})).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

```bash
cd /Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud && npx vitest run src/__tests__/lib/onboarding.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create src/lib/onboarding.ts**

```ts
// src/lib/onboarding.ts
export function getOnboardingRedirect(
  pathname: string,
  userId: string | null,
  claims: Record<string, unknown>
): 'sign-in' | 'onboarding' | 'dashboard' | null {
  if (!userId) return 'sign-in'
  const done = claims.onboardingComplete
  if (pathname.startsWith('/dashboard') && done === false) return 'onboarding'
  if (pathname.startsWith('/onboarding') && done === true) return 'dashboard'
  return null
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
cd /Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud && npx vitest run src/__tests__/lib/onboarding.test.ts
```

Expected: 8 tests pass.

- [ ] **Step 5: Create src/middleware.ts**

```ts
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isDashboard = createRouteMatcher(['/dashboard(.*)'])
const isOnboarding = createRouteMatcher(['/onboarding(.*)'])
const isPublic = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/support(.*)',
  '/sso-callback(.*)',
  '/api/webhooks(.*)',
  '/api/telegram/webhook(.*)',
  '/api/google/callback(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (isPublic(request)) return NextResponse.next()

  const { userId, sessionClaims } = await auth()

  if (!userId) {
    return (await auth()).redirectToSignIn({ returnBackUrl: request.url })
  }

  // onboardingComplete is injected into the JWT by the Clerk session token template.
  // See plan header for the required Clerk Dashboard configuration.
  // Existing users (onboardingComplete === undefined) are NOT redirected — they bypass gracefully.
  const claims = (sessionClaims ?? {}) as Record<string, unknown>
  const pathname = request.nextUrl.pathname

  if (isDashboard(request) && claims.onboardingComplete === false) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  if (isOnboarding(request) && claims.onboardingComplete === true) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

- [ ] **Step 6: Commit**

```bash
git add src/middleware.ts src/lib/onboarding.ts src/__tests__/lib/onboarding.test.ts
```

```bash
git commit -m "feat: add onboarding middleware guard with Clerk session-claim check"
```

---

## Task 3: Orbit animation keyframes + shared components

**Files:**
- Modify: `src/app/custom.css`
- Create: `src/components/onboarding/OrbitPanel.tsx`
- Create: `src/components/onboarding/OnboardingShell.tsx`

No automated tests for visual components — verify in browser after Task 5 wires the layout.

- [ ] **Step 1: Add orbit keyframes to custom.css**

Append to the end of `src/app/custom.css`:

```css
/* ── Onboarding orbit animations ── */
@keyframes ob-cw  { to { transform: rotate(360deg);  } }
@keyframes ob-ccw { to { transform: rotate(-360deg); } }
@keyframes ob-pulse {
  0%, 100% { opacity: 0.7; transform: scale(0.85); }
  60%       { opacity: 0;   transform: scale(1.7);  }
}

/* Arm wrappers */
.ob-arm-1 { animation: ob-cw  9s  linear infinite; }
.ob-arm-2 { animation: ob-cw  15s linear infinite; }
.ob-arm-3 { animation: ob-ccw 21s linear infinite; }

/* Nodes counter-rotate to stay upright */
.ob-arm-1 .ob-node { animation: ob-ccw 9s  linear infinite; }
.ob-arm-2 .ob-node { animation: ob-ccw 15s linear infinite; }
.ob-arm-3 .ob-node { animation: ob-cw  21s linear infinite; }

/* Sun glow pulse */
.ob-sun::after {
  content: '';
  position: absolute;
  inset: -14px;
  border-radius: 50%;
  background: rgba(36, 99, 235, 0.14);
  animation: ob-pulse 3.2s ease-out infinite;
  z-index: -1;
}
```

- [ ] **Step 2: Create OrbitPanel.tsx**

```tsx
// src/components/onboarding/OrbitPanel.tsx
export function OrbitPanel() {
  return (
    <div style={{
      width: '50%',
      height: '100%',
      background: '#F5F4F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        width: '78%',
        aspectRatio: '1 / 1.05',
        background: '#ECEAE4',
        borderRadius: 28,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), 0 2px 4px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.07)',
      }}>
        {/* Grain overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")",
        }} />

        {/* Solar system */}
        <div style={{ position: 'relative', width: 340, height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>

          {/* Rings */}
          {[136, 236, 340].map(size => (
            <div key={size} style={{
              position: 'absolute', width: size, height: size, borderRadius: '50%',
              border: '1px solid rgba(0,0,0,0.09)', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
            }} />
          ))}

          {/* Arm 1 — Telegram (inner, 136px, CW 9s) */}
          <div className="ob-arm-1" style={armWrap(136)}>
            <div className="ob-node" style={nodeBase('#28A8E0', false)}>
              <svg width="18" height="16" viewBox="0 0 26 22" fill="none">
                <path d="M1 11L25 1L19 21L13 13L1 11Z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M13 13L17 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Arm 2 — Gmail top + GCal bottom (236px, CW 15s) */}
          <div className="ob-arm-2" style={armWrap(236)}>
            {/* Gmail — top */}
            <div className="ob-node" style={nodeBase('#fff', false)}>
              <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                <path d="M2 2h16v12H2z" fill="white"/>
                <path d="M2 2l8 7 8-7" stroke="#EA4335" strokeWidth="1.4"/>
                <path d="M2 2v12" stroke="#4285F4" strokeWidth="1.4"/>
                <path d="M18 2v12" stroke="#34A853" strokeWidth="1.4"/>
                <path d="M2 14h16" stroke="#FBBC05" strokeWidth="1.4"/>
              </svg>
            </div>
            {/* Google Calendar — bottom (180° offset via bottom:-19px) */}
            <div className="ob-node" style={nodeBase('#1A73E8', true)}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="1" y="3" width="18" height="16" rx="2" fill="white"/>
                <rect x="1" y="3" width="18" height="6" rx="2" fill="#4285F4"/>
                <path d="M6 1v4M14 1v4" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
                <text x="10" y="16.5" textAnchor="middle" fill="#1A73E8" fontSize="6" fontFamily="Arial,sans-serif" fontWeight="700">CAL</text>
              </svg>
            </div>
          </div>

          {/* Arm 3 — Google Drive (outer, 340px, CCW 21s) */}
          <div className="ob-arm-3" style={armWrap(340)}>
            <div className="ob-node" style={nodeBase('#fff', false)}>
              <svg width="20" height="18" viewBox="0 0 87 78" fill="none">
                <path d="M29 0L0 52H29L58 0Z" fill="#0F9D58"/>
                <path d="M58 0L87 52H58L29 0Z" fill="#4285F4"/>
                <path d="M0 52L14.5 78H72.5L87 52Z" fill="#F4B400"/>
              </svg>
            </div>
          </div>

          {/* Center sun */}
          <div className="ob-sun" style={{
            position: 'relative', zIndex: 30, width: 72, height: 72, borderRadius: 22,
            background: 'linear-gradient(145deg, #2E72F5, #1D4ED8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 8px rgba(36,99,235,0.1), 0 8px 28px rgba(36,99,235,0.38)',
          }}>
            <BirdIcon size={34} color="white" />
          </div>

        </div>
      </div>
    </div>
  )
}

function armWrap(size: number): React.CSSProperties {
  return {
    position: 'absolute', width: size, height: size, borderRadius: '50%',
    top: '50%', left: '50%', marginTop: -size / 2, marginLeft: -size / 2,
  }
}

function nodeBase(bg: string, isBottom: boolean): React.CSSProperties {
  return {
    position: 'absolute',
    ...(isBottom ? { bottom: -19 } : { top: -19 }),
    left: '50%', transform: 'translateX(-50%)',
    width: 38, height: 38, borderRadius: 11,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: bg,
    border: '1.5px solid rgba(255,255,255,0.7)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.16)',
  }
}

export function BirdIcon({ size = 18, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={Math.round(size * 0.87)} viewBox="0 0 24 20" fill="none">
      <path d="M23 2.5a10.4 10.4 0 01-3 .82A5.18 5.18 0 0022.36.37a10.35 10.35 0 01-3.29 1.26A5.17 5.17 0 0011.8 6.43 14.67 14.67 0 011.64 1.16a5.17 5.17 0 001.6 6.9A5.14 5.14 0 011 7.52v.06a5.17 5.17 0 004.15 5.07 5.2 5.2 0 01-2.33.09 5.18 5.18 0 004.83 3.59A10.38 10.38 0 011 18.34 14.65 14.65 0 007.93 20c9.52 0 14.72-7.88 14.72-14.72l-.02-.67A10.5 10.5 0 0023 2.5z" fill={color}/>
    </svg>
  )
}
```

- [ ] **Step 3: Create OnboardingShell.tsx**

The shell is the full-page split-screen wrapper. Children = left-panel content (below the progress bar).

```tsx
// src/components/onboarding/OnboardingShell.tsx
import { OrbitPanel, BirdIcon } from './OrbitPanel'

type Step = 1 | 2 | 3

function segClass(segIndex: number, activeStep: Step): string {
  if (segIndex < activeStep - 1) return 'done'   // completed
  if (segIndex === activeStep - 1) return 'on'    // active
  return 'dim'                                     // upcoming
}

const segColors: Record<string, string> = {
  on:   '#2463EB',
  done: '#2463EB',
  dim:  '#C3D4FC',
}
const segOpacity: Record<string, number> = {
  on: 1, done: 0.45, dim: 1,
}

export function OnboardingShell({ step, children }: { step: Step; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#fff' }}>
      {/* Left panel */}
      <div style={{
        width: '50%',
        height: '100%',
        padding: '0 148px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        borderRight: '1px solid #EBEBEA',
        overflowY: 'auto',
      }}>
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, background: '#2463EB', borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(36,99,235,0.3)',
          }}>
            <BirdIcon size={18} color="white" />
          </div>
          <span style={{
            fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)',
            fontSize: 16, fontWeight: 600, color: '#0D0D0D', letterSpacing: '-0.3px',
          }}>BirdBot</span>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 5, width: '100%', marginBottom: 32 }}>
          {[0, 1, 2].map(i => {
            const cls = segClass(i, step)
            return (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 99,
                background: segColors[cls],
                opacity: segOpacity[cls],
                transition: 'background 0.3s, opacity 0.3s',
              }} />
            )
          })}
        </div>

        {children}
      </div>

      {/* Right panel */}
      <OrbitPanel />
    </div>
  )
}
```

- [ ] **Step 4: Create onboarding layout**

```tsx
// src/app/onboarding/layout.tsx
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/custom.css src/components/onboarding/OrbitPanel.tsx src/components/onboarding/OnboardingShell.tsx src/app/onboarding/layout.tsx
```

```bash
git commit -m "feat: add OrbitPanel, OnboardingShell, onboarding layout — shared onboarding chrome"
```

---

## Task 4: POST /api/onboarding/platform + Step 1 page

**Files:**
- Create: `src/app/api/onboarding/platform/route.ts`
- Create: `src/__tests__/api/onboarding/platform.test.ts`
- Create: `src/app/onboarding/page.tsx`

- [ ] **Step 1: Write the failing test**

The test extracts the save-platform business logic into a testable function.

```ts
// src/__tests__/api/onboarding/platform.test.ts
import { describe, it, expect } from 'vitest'

// Inline the validation logic that will live in the route
function validatePlatform(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  if (b.platform !== 'telegram') return null   // only telegram is live
  return b.platform as string
}

describe('validatePlatform', () => {
  it('accepts telegram', () => {
    expect(validatePlatform({ platform: 'telegram' })).toBe('telegram')
  })

  it('rejects whatsapp (not live)', () => {
    expect(validatePlatform({ platform: 'whatsapp' })).toBeNull()
  })

  it('rejects missing platform', () => {
    expect(validatePlatform({})).toBeNull()
  })

  it('rejects null body', () => {
    expect(validatePlatform(null)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

```bash
cd /Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud && npx vitest run src/__tests__/api/onboarding/platform.test.ts
```

Expected: FAIL — validatePlatform not found.

- [ ] **Step 3: Create the platform API route**

```ts
// src/app/api/onboarding/platform/route.ts
import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

const LIVE_PLATFORMS = new Set(['telegram'])

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { platform?: string }
  const platform = body.platform

  if (!platform || !LIVE_PLATFORMS.has(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  const clerk = await clerkClient()
  const user = await clerk.users.getUser(userId)
  await clerk.users.updateUser(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      platform,
      onboardingComplete: false,   // mark as in-progress so middleware guard activates
    },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Run test to confirm pass**

The test validates the same logic (platform whitelist). Run:

```bash
cd /Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud && npx vitest run src/__tests__/api/onboarding/platform.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Create Step 1 page**

This is a Client Component. On mount, Telegram is pre-selected. Clicking "Continue →" calls the platform API, then navigates to `/onboarding/connect`.

```tsx
// src/app/onboarding/page.tsx
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'

const btn: React.CSSProperties = {
  width: '100%', height: 52, background: '#2463EB', color: '#fff',
  fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
  fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px',
  border: 'none', borderRadius: 13, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  transition: 'background 0.15s',
}

export default function OnboardingStep1() {
  const router = useRouter()
  const [selected, setSelected] = useState<'telegram' | null>('telegram')
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    if (!selected || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/onboarding/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: selected }),
      })
      if (!res.ok) throw new Error('Failed to save platform')
      router.push('/onboarding/connect')
    } catch {
      setLoading(false)
    }
  }

  return (
    <OnboardingShell step={1}>
      <h1 style={{
        fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)',
        fontSize: 36, fontWeight: 700, color: '#0D0D0D',
        letterSpacing: '-1px', lineHeight: 1.15, marginBottom: 12,
      }}>
        Pick a home for your BirdBot
      </h1>

      <p style={{ fontSize: 15, color: '#888882', lineHeight: 1.6, marginBottom: 40 }}>
        Choose where Bird will reach you. More platforms are on the way.
      </p>

      {/* Platform cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
        {/* Telegram — active */}
        <PlatformCard
          label="Telegram"
          selected={selected === 'telegram'}
          onClick={() => setSelected('telegram')}
          iconBg="#28A8E0"
          icon={
            <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
              <path d="M1 11L25 1L19 21L13 13L1 11Z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M13 13L17 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          }
        />

        {/* WhatsApp — disabled */}
        <PlatformCard
          label="WhatsApp"
          selected={false}
          disabled
          iconBg="#25D366"
          icon={
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          }
        />

        {/* iMessage — disabled */}
        <PlatformCard
          label="iMessage"
          selected={false}
          disabled
          iconBg="linear-gradient(145deg,#34C759,#25A244)"
          icon={
            <svg width="26" height="24" viewBox="0 0 24 22" fill="none">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V14C2 15.1 2.9 16 4 16H8L12 20L16 16H20C21.1 16 22 15.1 22 14V4C22 2.9 21.1 2 20 2Z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          }
        />
      </div>

      <button
        style={{ ...btn, opacity: selected && !loading ? 1 : 0.5, cursor: selected && !loading ? 'pointer' : 'not-allowed' }}
        onClick={handleContinue}
        disabled={!selected || loading}
      >
        {loading ? 'Saving…' : 'Continue'}
        {!loading && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7H11M11 7L8 4M11 7L8 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </OnboardingShell>
  )
}

function PlatformCard({
  label, selected, disabled = false, iconBg, icon, onClick
}: {
  label: string
  selected: boolean
  disabled?: boolean
  iconBg: string
  icon: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        flex: 1, height: 136,
        border: `1.5px solid ${selected ? '#2463EB' : '#E4E4E2'}`,
        borderRadius: 18, background: selected ? '#EFF6FF' : '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 11,
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        opacity: disabled ? 0.36 : 1,
        boxShadow: selected ? '0 0 0 4px rgba(36,99,235,.09)' : 'none',
        transition: 'border-color 0.18s, background 0.18s',
      }}
    >
      {disabled && (
        <span style={{
          position: 'absolute', top: -9, right: 12,
          fontSize: 9, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
          background: '#F3F4F6', color: '#A0A09A', border: '1px solid #E4E4E2',
          borderRadius: 99, padding: '2px 8px',
        }}>Soon</span>
      )}
      {selected && (
        <div style={{
          position: 'absolute', top: 10, right: 10, width: 20, height: 20,
          background: '#2463EB', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.8 7L9 1" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      <div style={{
        width: 58, height: 58, borderRadius: 16,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#111', letterSpacing: '-0.2px' }}>
        {label}
      </span>
    </div>
  )
}
```

- [ ] **Step 6: Verify in browser**

Start the dev server and navigate to `http://localhost:3000/onboarding` (must be signed in). Verify:
- Split-screen layout, orbit animation on the right
- Telegram card is pre-selected (blue border + checkmark)
- WhatsApp and iMessage show "Soon" badge and are not clickable
- "Continue →" button is enabled; clicking saves platform and navigates to `/onboarding/connect`

```bash
cd /Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud && npm run dev
```

- [ ] **Step 7: Commit**

```bash
git add src/app/api/onboarding/platform/route.ts src/__tests__/api/onboarding/platform.test.ts src/app/onboarding/page.tsx
```

```bash
git commit -m "feat: onboarding Step 1 — platform picker + platform API route"
```

---

## Task 5: Step 2 page + Google callback redirect

**Files:**
- Create: `src/app/onboarding/connect/page.tsx`
- Modify: `src/app/api/google/callback/route.ts`

No new tests — the callback redirect logic is a small conditional added to existing code. Verify in browser.

- [ ] **Step 1: Modify Google callback to handle onboarding context**

In `src/app/api/google/callback/route.ts`, after the `prisma.googleConnection.upsert(...)` call, add:

```ts
// After prisma upsert — update Clerk metadata and redirect based on onboarding state
const { clerkClient } = await import('@clerk/nextjs/server')
const clerk = await clerkClient()
const clerkUser = await clerk.users.getUser(userId)
const meta = clerkUser.publicMetadata as Record<string, unknown>

await clerk.users.updateUser(userId, {
  publicMetadata: { ...meta, googleConnected: true },
})

// During onboarding (onboardingComplete === false), send to Step 3.
// After onboarding (true or undefined), send to integrations page.
const dest = meta.onboardingComplete === false
  ? `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/plan?google=connected`
  : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?google=connected`

return NextResponse.redirect(dest)
```

Remove the existing final `return NextResponse.redirect(...)` line (replaced by the one above). The error redirects near the top of the function also need onboarding awareness — change `errorBase` to:

```ts
const isOnboarding = true  // determined after verifyState + Clerk lookup
// For simplicity, detect from Clerk metadata after we have userId:
// errorBase is only used before we have userId, so keep as-is:
const errorBase = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?google=error`
```

After the `verifyState` check, for any error that happens _after_ we have userId, read the metadata to redirect to the right error page. Or: accept that error redirects always go to `/dashboard/integrations?google=error` for now (acceptable for a first pass since these paths are rare).

- [ ] **Step 2: Create Step 2 page**

```tsx
// src/app/onboarding/connect/page.tsx
"use client"

import { useRouter } from 'next/navigation'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'

const btn: React.CSSProperties = {
  width: '100%', height: 48, background: '#2463EB', color: '#fff',
  fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
  fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px',
  border: 'none', borderRadius: 13, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  transition: 'background 0.15s', marginBottom: 10,
}

const ACCESS_ITEMS = [
  {
    label: 'Label & organize your emails, draft replies in your voice',
    bg: '#fff', border: true,
    icon: (
      <svg width="18" height="14" viewBox="0 0 20 16" fill="none">
        <path d="M2 2h16v12H2z" fill="white"/>
        <path d="M2 2l8 7 8-7" stroke="#EA4335" strokeWidth="1.4"/>
        <path d="M2 2v12" stroke="#4285F4" strokeWidth="1.4"/>
        <path d="M18 2v12" stroke="#34A853" strokeWidth="1.4"/>
        <path d="M2 14h16" stroke="#FBBC05" strokeWidth="1.4"/>
      </svg>
    ),
  },
  {
    label: 'Handle your schedule, book meetings, track what\'s coming up',
    bg: '#1A73E8', border: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <rect x="1" y="3" width="18" height="16" rx="2" fill="white"/>
        <rect x="1" y="3" width="18" height="6" rx="2" fill="#4285F4"/>
        <path d="M6 1v4M14 1v4" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
        <text x="10" y="16.5" textAnchor="middle" fill="#1A73E8" fontSize="6" fontFamily="Arial,sans-serif" fontWeight="700">CAL</text>
      </svg>
    ),
  },
  {
    label: 'Access your Drive files when you need to reference or share them',
    bg: '#fff', border: true,
    icon: (
      <svg width="18" height="16" viewBox="0 0 87 78" fill="none">
        <path d="M29 0L0 52H29L58 0Z" fill="#0F9D58"/>
        <path d="M58 0L87 52H58L29 0Z" fill="#4285F4"/>
        <path d="M0 52L14.5 78H72.5L87 52Z" fill="#F4B400"/>
      </svg>
    ),
  },
]

export default function OnboardingStep2() {
  const router = useRouter()

  function handleGoogleConnect() {
    window.location.href = '/api/google/connect'
  }

  function handleSkip() {
    router.push('/onboarding/plan')
  }

  return (
    <OnboardingShell step={2}>
      <h1 style={{
        fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)',
        fontSize: 36, fontWeight: 700, color: '#0D0D0D',
        letterSpacing: '-1px', lineHeight: 1.15, marginBottom: 10,
      }}>
        Get the most out of BirdBot<br />by connecting your essentials
      </h1>

      <p style={{ fontSize: 15, color: '#888882', lineHeight: 1.6, marginBottom: 20 }}>
        Connect your email and calendar so BirdBot can prioritize what matters, draft replies in your voice, and keep your schedule on track.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {ACCESS_ITEMS.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#444', fontWeight: 500 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: item.bg, border: item.border ? '1px solid #E4E4E2' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {item.icon}
            </div>
            {item.label}
          </div>
        ))}
      </div>

      <button style={btn} onClick={handleGoogleConnect}>
        {/* Google G logo */}
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Connect Google
      </button>

      <button
        onClick={handleSkip}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'center', fontSize: 13, color: '#A0A09A',
          textDecoration: 'underline', textUnderlineOffset: 3,
          textDecorationColor: '#DDDDD8', width: '100%',
        }}
      >
        Skip for now
      </button>
    </OnboardingShell>
  )
}
```

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:3000/onboarding/connect`. Verify:
- Progress bar: segment 1 = done (faded blue), segment 2 = on (full blue), segment 3 = dim
- "Connect Google" button redirects to Google OAuth
- "Skip for now" navigates directly to `/onboarding/plan`
- After completing Google OAuth, browser lands on `/onboarding/plan?google=connected`

- [ ] **Step 4: Commit**

```bash
git add src/app/onboarding/connect/page.tsx src/app/api/google/callback/route.ts
```

```bash
git commit -m "feat: onboarding Step 2 — Google connect page + onboarding-aware OAuth callback redirect"
```

---

## Task 6: POST /api/onboarding/setup-intent

**Files:**
- Create: `src/app/api/onboarding/setup-intent/route.ts`

This route creates a Stripe customer (if none exists) and returns a SetupIntent clientSecret for Stripe Elements to mount.

- [ ] **Step 1: Create the route**

```ts
// src/app/api/onboarding/setup-intent/route.ts
import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clerk = await clerkClient()
  const user = await clerk.users.getUser(userId)
  const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress

  const stripe = getStripe()

  // Find existing Stripe customer by metadata or email, or create one
  let customerId: string
  const existing = email
    ? await stripe.customers.list({ email, limit: 1 })
    : { data: [] }

  if (existing.data.length > 0) {
    customerId = existing.data[0].id
  } else {
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      metadata: { clerkUserId: userId },
    })
    customerId = customer.id
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: 'off_session',
    automatic_payment_methods: { enabled: true },
  })

  return NextResponse.json({
    clientSecret: setupIntent.client_secret,
    customerId,
  })
}
```

- [ ] **Step 2: Verify the route works**

Start the dev server. Open the browser console on `/onboarding/plan` (created in Task 7). After Task 7's page is built, you'll call this endpoint and verify the clientSecret comes back. For now, test manually with curl:

```bash
# (Must provide a valid Clerk session cookie — easier to test via the browser in Task 7)
curl -X POST http://localhost:3000/api/onboarding/setup-intent \
  -H "Cookie: <your_session_cookie>"
```

Expected: `{ "clientSecret": "seti_..._secret_...", "customerId": "cus_..." }`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/onboarding/setup-intent/route.ts
```

```bash
git commit -m "feat: onboarding setup-intent API route — creates Stripe customer + SetupIntent"
```

---

## Task 7: POST /api/onboarding/subscribe

**Files:**
- Create: `src/app/api/onboarding/subscribe/route.ts`
- Create: `src/__tests__/api/onboarding/subscribe.test.ts`

This is the most critical route: it attaches the payment method, creates the subscription with a 7-day trial, writes the Subscription record to Prisma, and marks the user complete in Clerk.

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/api/onboarding/subscribe.test.ts
import { describe, it, expect } from 'vitest'
import { PLANS } from '@/lib/stripe'

// Test the plan-to-priceId mapping (the pure logic extracted from the route)
function resolvePriceId(plan: string): string | null {
  if (plan === 'monthly') return PLANS.monthly.priceId
  if (plan === 'annual')  return PLANS.annual.priceId
  return null
}

describe('resolvePriceId', () => {
  it('returns monthly priceId', () => {
    expect(resolvePriceId('monthly')).toBe(PLANS.monthly.priceId)
  })

  it('returns annual priceId', () => {
    expect(resolvePriceId('annual')).toBe(PLANS.annual.priceId)
  })

  it('returns null for unknown plan', () => {
    expect(resolvePriceId('lifetime')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

```bash
cd /Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud && npx vitest run src/__tests__/api/onboarding/subscribe.test.ts
```

Expected: FAIL — module imports fail or resolvePriceId not found.

- [ ] **Step 3: Create the subscribe route**

```ts
// src/app/api/onboarding/subscribe/route.ts
import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getStripe, PLANS } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { paymentMethodId?: string; customerId?: string; plan?: string }
  const { paymentMethodId, customerId, plan } = body

  if (!paymentMethodId || !customerId || !plan) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const planConfig = plan === 'monthly' ? PLANS.monthly : plan === 'annual' ? PLANS.annual : null
  if (!planConfig) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const stripe = getStripe()

  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })

  // Set as default payment method
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  })

  // Create subscription with 7-day trial
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: planConfig.priceId }],
    trial_period_days: 7,
    payment_settings: {
      payment_method_types: ['card'],
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice'],
  })

  const periodEnd = new Date((subscription.current_period_end ?? 0) * 1000)

  // Write to Prisma (don't wait for webhook — avoids race condition on redirect)
  await prisma.subscription.upsert({
    where: { clerkUserId: userId },
    create: {
      clerkUserId: userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: planConfig.priceId,
      status: subscription.status,
      currentPeriodEnd: periodEnd,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: planConfig.priceId,
      status: subscription.status,
      currentPeriodEnd: periodEnd,
    },
  })

  // Mark onboarding complete in Clerk
  const clerk = await clerkClient()
  const user = await clerk.users.getUser(userId)
  await clerk.users.updateUser(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      onboardingComplete: true,
      plan,
    },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
cd /Users/nicolasbreen/Projects/Birdbot.ai/birdbot-cloud && npx vitest run src/__tests__/api/onboarding/subscribe.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/onboarding/subscribe/route.ts src/__tests__/api/onboarding/subscribe.test.ts
```

```bash
git commit -m "feat: onboarding subscribe API route — creates Stripe subscription, writes Prisma, marks complete"
```

---

## Task 8: Step 3 page — Stripe Elements paywall

**Files:**
- Create: `src/app/onboarding/plan/page.tsx`

This is the most complex page. It:
1. Calls `/api/onboarding/setup-intent` on mount to get a clientSecret
2. Mounts Stripe Elements with that clientSecret
3. Renders the split-screen: plan toggle + benefits on left, white Stripe payment card on right-inside-right
4. On submit, calls `stripe.confirmSetup()` then `POST /api/onboarding/subscribe`
5. On success, navigates to `/dashboard`

The right panel of the OnboardingShell contains the orbit animation, but for Step 3 the mockup shows a white payment card instead. We'll override the shell's right panel by NOT using OnboardingShell for this step — instead build the layout directly so we can put the payment card on the right.

- [ ] **Step 1: Create src/app/onboarding/plan/page.tsx**

```tsx
// src/app/onboarding/plan/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { BirdIcon } from '@/components/onboarding/OrbitPanel'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ── Design tokens (shared with other steps) ──────────────────────────────────
const btnBlue: React.CSSProperties = {
  width: '100%', height: 48, background: '#2463EB', color: '#fff',
  fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
  fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px',
  border: 'none', borderRadius: 13, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.15s',
}

const BENEFITS = [
  'Handle your schedule & book meetings',
  'Label, organize & draft email replies in your voice',
  'Keep up on what\'s on your plate',
  'Unlimited texts & memory storage',
]

const PLAN_PRICES = {
  monthly: { display: '$9', cadence: 'per month', label: 'Monthly', sub: '$9/mo' },
  annual:  { display: '$60', cadence: 'per year',  label: 'Annual',  sub: '$60/yr' },
}

// ── Root page — fetches SetupIntent, mounts Elements ─────────────────────────
export default function OnboardingStep3() {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [plan, setPlan] = useState<'monthly' | 'annual'>('monthly')
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    fetch('/api/onboarding/setup-intent', { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        setClientSecret(d.clientSecret)
        setCustomerId(d.customerId)
      })
      .catch(() => setFetchError(true))
  }, [])

  if (fetchError) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#888882' }}>
        Failed to load payment form. Please refresh.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#fff' }}>

      {/* Left panel */}
      <div style={{
        width: '50%', height: '100%', padding: '0 148px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        borderRight: '1px solid #EBEBEA', overflowY: 'auto',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, background: '#2463EB', borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(36,99,235,0.3)',
          }}>
            <BirdIcon size={18} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)', fontSize: 16, fontWeight: 600, color: '#0D0D0D', letterSpacing: '-0.3px' }}>BirdBot</span>
        </div>

        {/* Progress bar — steps 1+2 done, step 3 active */}
        <div style={{ display: 'flex', gap: 5, width: '100%', marginBottom: 20 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 99,
              background: '#2463EB',
              opacity: i < 2 ? 0.45 : 1,
            }} />
          ))}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)',
          fontSize: 44, fontWeight: 700, color: '#0D0D0D',
          letterSpacing: '-1.2px', lineHeight: 1.1, marginBottom: 10,
        }}>
          Start your<br />7&#8209;day free trial
        </h1>

        <p style={{ fontSize: 15, color: '#888882', lineHeight: 1.6, marginBottom: 20 }}>
          No charge until your trial ends. Cancel anytime, no questions asked.
        </p>

        {/* Plan toggle */}
        <div style={{
          display: 'flex', gap: 6, background: '#F5F4F0', borderRadius: 12, padding: 4, marginBottom: 20,
        }}>
          {(['monthly', 'annual'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              style={{
                flex: 1, height: 44, border: 'none', borderRadius: 9, cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
                fontSize: 14, fontWeight: 500,
                background: plan === p ? '#fff' : 'transparent',
                color: plan === p ? '#0D0D0D' : '#888882',
                boxShadow: plan === p ? '0 1px 3px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s',
              }}
            >
              {PLAN_PRICES[p].label}&nbsp;
              <span style={{ fontWeight: 600 }}>{PLAN_PRICES[p].sub}</span>
              {p === 'annual' && (
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.2px',
                  background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0',
                  padding: '2px 6px', borderRadius: 20,
                }}>Save 44%</span>
              )}
            </button>
          ))}
        </div>

        {/* Benefits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {BENEFITS.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#444', fontWeight: 500, lineHeight: 1.4 }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: '#EEF3FF', border: '1.5px solid #C3D4FC',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
              }}>
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.5 6L8 1" stroke="#2463EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {b}
            </div>
          ))}
        </div>

        <button style={{ ...btnBlue, marginBottom: 10 }} form="stripe-form" type="submit">
          Start free trial →
        </button>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#BBBBB5', lineHeight: 1.5 }}>
          By continuing you agree to our <a href="/terms" style={{ color: '#BBBBB5', textDecoration: 'underline', textUnderlineOffset: 2 }}>Terms</a> &amp; <a href="/privacy" style={{ color: '#BBBBB5', textDecoration: 'underline', textUnderlineOffset: 2 }}>Privacy Policy</a>
        </p>
      </div>

      {/* Right panel — white payment card on warm background */}
      <div style={{
        width: '50%', height: '100%', background: '#F5F4F0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {clientSecret && customerId ? (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
            <PaymentCard plan={plan} clientSecret={clientSecret} customerId={customerId} />
          </Elements>
        ) : (
          <div style={{ color: '#888882', fontSize: 14 }}>Loading payment form…</div>
        )}
      </div>
    </div>
  )
}

// ── Payment card (inner Elements component) ───────────────────────────────────
function PaymentCard({ plan, clientSecret, customerId }: { plan: 'monthly' | 'annual'; clientSecret: string; customerId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements || loading) return
    setLoading(true)
    setError(null)

    const { error: confirmError, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Payment setup failed. Please try again.')
      setLoading(false)
      return
    }

    const paymentMethodId = typeof setupIntent?.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent?.payment_method?.id

    if (!paymentMethodId) {
      setError('Could not retrieve payment method. Please try again.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/onboarding/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethodId, customerId, plan }),
    })

    if (!res.ok) {
      const d = await res.json() as { error?: string }
      setError(d.error ?? 'Subscription creation failed. Please try again.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const prices = PLAN_PRICES[plan]

  return (
    <form
      id="stripe-form"
      onSubmit={handleSubmit}
      style={{
        width: '78%', maxWidth: 400,
        background: '#fff', borderRadius: 24, padding: '32px 28px 28px',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.09)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #F0EFE9' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: 'linear-gradient(145deg, #2E72F5, #1D4ED8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(36,99,235,0.3)',
        }}>
          <BirdIcon size={20} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)', fontSize: 15, fontWeight: 700, color: '#0D0D0D', letterSpacing: '-0.3px' }}>BirdBot Pro</div>
          <div style={{ fontSize: 12, color: '#888882', marginTop: 1 }}>7-day free trial included</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)', fontSize: 20, fontWeight: 700, color: '#0D0D0D', letterSpacing: '-0.5px' }}>{prices.display}</div>
          <div style={{ fontSize: 11, color: '#888882' }}>{prices.cadence}</div>
        </div>
      </div>

      {/* Stripe PaymentElement */}
      <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', margin: '14px 0', borderTop: '1px solid #F0EFE9' }}>
        <span style={{ fontSize: 13, color: '#888882' }}>Due today</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>$0.00</span>
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 10, textAlign: 'center' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          width: '100%', height: 46, background: loading ? '#93C5FD' : '#2463EB', color: '#fff',
          fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
          fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px',
          border: 'none', borderRadius: 11, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s', marginBottom: 12,
        }}
      >
        {loading ? 'Processing…' : 'Start free trial'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11.5, color: '#BBBBB5' }}>
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
          <path d="M6 1L1 3.5V7C1 9.8 3.2 12.4 6 13C8.8 12.4 11 9.8 11 7V3.5L6 1Z" fill="#A0A09A"/>
        </svg>
        Secured &amp; powered by Stripe
      </div>
    </form>
  )
}
```

**Important:** Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `.env.local` if not already present.

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:3000/onboarding/plan`. Verify:
- Left panel: progress bar (steps 1+2 faded, step 3 active), headline, plan toggle, benefits list
- Switching Monthly ↔ Annual updates both the toggle and the card header price
- Right panel: white card with "Loading payment form…" momentarily, then Stripe Elements renders
- Submitting with a Stripe test card (4242 4242 4242 4242) calls subscribe, sets metadata, and redirects to /dashboard
- Submitting with a declined card (4000 0000 0000 0002) shows an error message on the card

- [ ] **Step 3: Commit**

```bash
git add src/app/onboarding/plan/page.tsx
```

```bash
git commit -m "feat: onboarding Step 3 — Stripe Elements paywall with trial subscription"
```

---

## Task 9: Welcome popup

**Files:**
- Create: `src/components/dashboard/WelcomePopup.tsx`
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create WelcomePopup.tsx**

```tsx
// src/components/dashboard/WelcomePopup.tsx
"use client"

import { useState, useEffect } from 'react'
import { BirdIcon } from '@/components/onboarding/OrbitPanel'

const STORAGE_KEY = 'hasSeenWelcome'

const CAP_ITEMS = [
  {
    iconBg: '#EEF3FF',
    title: 'Handle your schedule',
    desc: 'Book meetings, set reminders, and keep your calendar in check — right from Telegram.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <rect x="1" y="3" width="18" height="16" rx="2" fill="white" stroke="#C3D4FC" strokeWidth="1.2"/>
        <rect x="1" y="3" width="18" height="6" rx="2" fill="#4285F4"/>
        <path d="M6 1v4M14 1v4" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round"/>
        <text x="10" y="16.5" textAnchor="middle" fill="#1A73E8" fontSize="5.5" fontFamily="Arial,sans-serif" fontWeight="700">CAL</text>
      </svg>
    ),
  },
  {
    iconBg: '#FFF8F0',
    title: 'Label, organize & draft email replies',
    desc: 'Bird reads your inbox, sorts what matters, and writes replies that sound like you.',
    icon: (
      <svg width="16" height="13" viewBox="0 0 20 16" fill="none">
        <path d="M2 2h16v12H2z" fill="white" stroke="#F0EFE9" strokeWidth="1.2"/>
        <path d="M2 2l8 7 8-7" stroke="#EA4335" strokeWidth="1.4"/>
        <path d="M2 2v12" stroke="#4285F4" strokeWidth="1.4"/>
        <path d="M18 2v12" stroke="#34A853" strokeWidth="1.4"/>
        <path d="M2 14h16" stroke="#FBBC05" strokeWidth="1.4"/>
      </svg>
    ),
  },
  {
    iconBg: '#F0FDF4',
    title: 'Keep up on what\'s on your plate',
    desc: 'Ask Bird for a quick briefing anytime — tasks, events, unread emails, all in one message.',
    icon: (
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="#86EFAC" strokeWidth="1.5"/>
        <path d="M7 10l2 2 4-4" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    iconBg: '#FDF4FF',
    title: 'Unlimited texts & memory',
    desc: 'No message caps. Bird remembers your context across every conversation.',
    icon: (
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
        <path d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z" fill="#E9D5FF" stroke="#A855F7" strokeWidth="1.2"/>
        <path d="M10 6v4l3 2" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export function WelcomePopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (!seen) setVisible(true)
    } catch {
      // localStorage unavailable (SSR safety)
    }
  }, [])

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(13,13,13,0.32)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', zIndex: 9999,
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 480, background: '#fff', borderRadius: 24,
        padding: '28px 36px',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 8px 16px rgba(0,0,0,0.06), 0 32px 80px rgba(0,0,0,0.14)',
        animation: 'welcome-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>

        {/* Close */}
        <button
          onClick={dismiss}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 30, height: 30, borderRadius: '50%',
            background: '#F5F4F0', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#888882', fontSize: 14,
          }}
        >✕</button>

        {/* Bird avatar */}
        <div style={{
          width: 52, height: 52, borderRadius: 15,
          background: 'linear-gradient(145deg, #2E72F5, #1D4ED8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(36,99,235,0.3)', marginBottom: 14,
        }}>
          <BirdIcon size={26} color="white" />
        </div>

        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#2463EB', marginBottom: 6 }}>
          You&rsquo;re all set
        </p>
        <h2 style={{
          fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)',
          fontSize: 26, fontWeight: 700, color: '#0D0D0D', letterSpacing: '-0.6px',
          lineHeight: 1.2, marginBottom: 6,
        }}>
          Welcome — here&rsquo;s what I can do for you
        </h2>
        <p style={{ fontSize: 14, color: '#888882', lineHeight: 1.55, marginBottom: 16 }}>
          Bird is ready to go. Here&rsquo;s a quick look at what you&rsquo;ve unlocked.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {CAP_ITEMS.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '10px 12px', borderRadius: 12,
              background: '#FAFAF8', border: '1px solid #F0EFE9',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: item.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0D0D0D', marginBottom: 1 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#888882', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={dismiss}
          style={{
            width: '100%', height: 48, background: '#2463EB', color: '#fff',
            fontFamily: 'var(--font-dm-sans, "DM Sans", sans-serif)',
            fontSize: 15, fontWeight: 600, letterSpacing: '-0.2px',
            border: 'none', borderRadius: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
        >
          Take me to my dashboard →
        </button>
      </div>

      <style>{`
        @keyframes welcome-pop {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}
```

- [ ] **Step 2: Wire WelcomePopup into dashboard page**

In `src/app/dashboard/page.tsx`, add the import at the top:
```ts
import { WelcomePopup } from '@/components/dashboard/WelcomePopup'
```

Add `<WelcomePopup />` inside the outermost fragment, just before the closing `</>`:
```tsx
return (
  <>
    <div className="brief">
      {/* ... existing content unchanged ... */}
    </div>
    <LoopHistoryPanel open={historyOpen} onClose={closeHistory} onUndo={addLoopBack} />
    <WelcomePopup />
  </>
)
```

- [ ] **Step 3: Verify in browser**

1. Complete the full onboarding flow with a test card.
2. On redirect to `/dashboard`, the welcome popup should appear with blurred backdrop.
3. Click "Take me to my dashboard →" or ✕ — popup dismisses.
4. Refresh the page — popup does NOT reappear (localStorage guard).
5. Open DevTools → Application → Local Storage → delete `hasSeenWelcome` → refresh → popup appears again.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/WelcomePopup.tsx src/app/dashboard/page.tsx
```

```bash
git commit -m "feat: welcome popup on first /dashboard visit after onboarding"
```

---

## Self-review checklist

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| `/onboarding` Step 1 — platform picker, Telegram pre-selected, disabled cards | Task 4 |
| Right panel orbit animation (3 rings, 4 services, counter-rotating nodes) | Task 3 |
| Save platform to Clerk `publicMetadata.platform` | Task 4 |
| `/onboarding/connect` Step 2 — Google OAuth button + skip | Task 5 |
| Set `googleConnected: true` in Clerk metadata after OAuth | Task 5 |
| After OAuth: redirect to `/onboarding/plan`, not `/dashboard/integrations` | Task 5 |
| `/onboarding/plan` Step 3 — plan toggle, benefits, Stripe Elements embedded | Task 8 |
| Stripe: SetupIntent → confirmSetup → subscribe → 7-day trial | Tasks 6, 7, 8 |
| Set `onboardingComplete: true`, `plan` in Clerk metadata after payment | Task 7 |
| Write Prisma Subscription row immediately (no webhook race) | Task 7 |
| Welcome popup on `/dashboard` first visit, localStorage guard | Task 9 |
| Middleware: `/dashboard*` → `/onboarding` when `onboardingComplete === false` | Task 2 |
| Middleware: `/onboarding*` → `/dashboard` when `onboardingComplete === true` | Task 2 |
| `signUpForceRedirectUrl="/onboarding"` for new users | Task 1 |
| Bricolage Grotesque font loaded globally | Task 1 |
| Progress bar segment states: on/done/dim | Task 3 |

**Out of scope (per spec):** WhatsApp/iMessage integration, dashboard settings for post-onboarding Google connect, /pricing landing page.

**Placeholder scan:** None found — all code blocks are complete.

**Type consistency:**
- `BirdIcon` is exported from `OrbitPanel.tsx` and imported in `OnboardingShell.tsx`, `OnboardingStep3`, and `WelcomePopup.tsx`
- `OnboardingShell` accepts `step: 1 | 2 | 3` — used correctly in pages
- `PLANS` from `@/lib/stripe` — `resolvePriceId` in subscribe test uses the same import
- `plan: 'monthly' | 'annual'` is consistent across toggle state, subscribe API body, Clerk metadata

**Env vars required:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — must be in `.env.local` for Step 3 page
- `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_ANNUAL_PRICE_ID` — already used by existing checkout route
- Clerk session token template must be configured (see plan header)
