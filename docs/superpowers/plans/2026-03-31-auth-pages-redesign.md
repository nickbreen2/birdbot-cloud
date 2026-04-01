# Auth Pages Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current sign-in and sign-up pages with a minimal, clean design — no card, no decorations — featuring a faint star field background, the BirdBot logo, and Clerk form fields with a subtle fill style.

**Architecture:** A new shared `AuthBrand` component handles the logo and tagline above the Clerk form. The Clerk card is stripped to fully transparent via `clerkAppearance` updates. The existing `StarField` component runs full-screen behind everything.

**Tech Stack:** Next.js (App Router), Clerk (`@clerk/nextjs`), Tailwind CSS v4, TypeScript

> **Note:** Per `AGENTS.md`, this Next.js version has breaking changes. Read `node_modules/next/dist/docs/` if anything seems off before writing code.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `src/components/auth/AuthBrand.tsx` | Logo + wordmark + tagline above the Clerk form |
| Modify | `src/lib/clerk-appearance.ts` | Strip card chrome, hide Clerk header, restyle inputs |
| Modify | `src/app/sign-in/[[...sign-in]]/page.tsx` | Simplified page using AuthBrand + StarField |
| Modify | `src/app/sign-up/[[...sign-up]]/page.tsx` | Same as sign-in, different tagline |

---

## Task 1: Create `AuthBrand` component

**Files:**
- Create: `src/components/auth/AuthBrand.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Image from "next/image"

interface AuthBrandProps {
  tagline: string
}

export function AuthBrand({ tagline }: AuthBrandProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <Image
        src="/BirdBot-Icon-mark1.svg"
        alt="BirdBot"
        width={48}
        height={48}
        priority
        style={{ height: "auto" }}
      />
      <span
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "20px",
          fontWeight: 700,
          letterSpacing: "0.04em",
          color: "#f1f5f9",
        }}
      >
        BirdBot
      </span>
      <span style={{ fontSize: "13px", color: "#64748b" }}>{tagline}</span>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd birdbot-cloud && npx tsc --noEmit`
Expected: no errors related to `AuthBrand.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/AuthBrand.tsx
git commit -m "feat: add AuthBrand component for auth page branding"
```

---

## Task 2: Update `clerkAppearance` — strip card, hide header, restyle inputs

**Files:**
- Modify: `src/lib/clerk-appearance.ts`

- [ ] **Step 1: Replace the file contents**

```ts
export const clerkAppearance = {
  variables: {
    colorPrimary: "#2563eb",
    colorBackground: "transparent",
    colorText: "#f1f5f9",
    colorTextSecondary: "#94a3b8",
    colorInputBackground: "rgba(255,255,255,0.04)",
    colorInputText: "#f1f5f9",
    colorNeutral: "#94a3b8",
    borderRadius: "0.5rem",
  },
  elements: {
    card: {
      background: "transparent",
      border: "none",
      boxShadow: "none",
      backdropFilter: "none",
      WebkitBackdropFilter: "none",
      padding: "0",
    },
    headerTitle: { display: "none" },
    headerSubtitle: { display: "none" },
    formFieldLabel: { color: "#94a3b8" },
    formFieldInput: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid #1e2a45",
      color: "#f1f5f9",
      borderRadius: "6px",
    },
    formFieldInputShowPasswordButton: { color: "#64748b" },
    socialButtonsBlockButton: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid #1e2a45",
      color: "#f1f5f9",
    },
    socialButtonsBlockButtonText: { color: "#f1f5f9" },
    dividerLine: { background: "#1e2a45" },
    dividerText: { color: "#64748b" },
    footerActionLink: { color: "#60a5fa" },
    footerActionText: { color: "#94a3b8" },
    identityPreviewText: { color: "#f1f5f9" },
    identityPreviewEditButton: { color: "#3b82f6" },
    alternativeMethodsBlockButton: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid #1e2a45",
      color: "#f1f5f9",
    },
    otpCodeFieldInput: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid #1e2a45",
      color: "#f1f5f9",
    },
    selectButton: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid #1e2a45",
      color: "#f1f5f9",
    },
    selectOptionsContainer: {
      background: "#111827",
      border: "1px solid #1e2a45",
    },
    selectOption: {
      background: "#111827",
      color: "#f1f5f9",
    },
    formButtonPrimary: { color: "#ffffff" },
    footer: { background: "transparent", color: "#94a3b8" },
    footerPages: { color: "#94a3b8" },
    powerButton: { color: "#94a3b8" },
  },
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd birdbot-cloud && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/clerk-appearance.ts
git commit -m "feat: strip clerk card chrome and restyle inputs for minimal auth pages"
```

---

## Task 3: Update sign-in page

**Files:**
- Modify: `src/app/sign-in/[[...sign-in]]/page.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import { SignIn } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-appearance"
import { StarField } from "@/components/StarField"
import { AuthBrand } from "@/components/auth/AuthBrand"

export default function SignInPage() {
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{ background: "#0a0e1a" }}
    >
      <StarField count={80} />
      <div
        className="relative flex flex-col items-center gap-8"
        style={{ zIndex: 10, width: "100%", maxWidth: "380px" }}
      >
        <AuthBrand tagline="Sign in to continue" />
        <SignIn appearance={clerkAppearance} />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd birdbot-cloud && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/sign-in/[[...sign-in]]/page.tsx
git commit -m "feat: redesign sign-in page — minimal layout with star field"
```

---

## Task 4: Update sign-up page

**Files:**
- Modify: `src/app/sign-up/[[...sign-up]]/page.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import { SignUp } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-appearance"
import { StarField } from "@/components/StarField"
import { AuthBrand } from "@/components/auth/AuthBrand"

export default function SignUpPage() {
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{ background: "#0a0e1a" }}
    >
      <StarField count={80} />
      <div
        className="relative flex flex-col items-center gap-8"
        style={{ zIndex: 10, width: "100%", maxWidth: "380px" }}
      >
        <AuthBrand tagline="Create your account" />
        <SignUp appearance={clerkAppearance} />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd birdbot-cloud && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/sign-up/[[...sign-up]]/page.tsx
git commit -m "feat: redesign sign-up page — minimal layout with star field"
```

---

## Task 5: Smoke test

- [ ] **Step 1: Start the dev server**

Run: `cd birdbot-cloud && npm run dev`
Expected: server starts on `http://localhost:3000`

- [ ] **Step 2: Check sign-in page**

Open `http://localhost:3000/sign-in` and verify:
- Dark background with faint twinkling stars visible
- BirdBot SVG icon (48px) at top, no animation, no glow rings
- "BirdBot" wordmark below icon
- "Sign in to continue" tagline below wordmark
- No card box / no border / no shadow around the Clerk form
- Form fields have a barely-there fill with a thin dark border
- Social auth button (Google) visible with subtle fill
- "Don't have an account? Sign up" link present at bottom

- [ ] **Step 3: Check sign-up page**

Open `http://localhost:3000/sign-up` and verify:
- Same visual treatment as sign-in
- Tagline reads "Create your account"
- Sign-up form fields render correctly

- [ ] **Step 4: Check mobile**

Resize browser to 375px width and verify:
- Form is centered and readable
- No horizontal overflow

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: auth page smoke test adjustments"
```
