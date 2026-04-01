# Auth Pages Redesign

**Date:** 2026-03-31
**Scope:** `/sign-in` and `/sign-up` pages only

## Goal

Replace the current auth pages (radial spotlight, floating animated bird icon, heavy Clerk card chrome) with a minimal, clean design — no card, no heavy decorations — that matches the quality bar of high-end SaaS products.

## Design Decisions

- **Layout:** Minimal / clean — no card, no chrome. Form floats directly on the page.
- **Background:** Existing `StarField` component with `count={80}` (sparser than the landing page default of 150), full-screen behind everything.
- **Form fields:** Subtle fill — `rgba(255,255,255,0.04)` background, `1px solid #1e2a45` border, `6px` border radius.
- **Auth library:** Clerk kept. Use Clerk's `<SignIn>` / `<SignUp>` components with the card stripped invisible and Clerk's own header hidden.
- **Approach:** Custom branded wrapper + Clerk (Approach B) — full control over the branding section, Clerk owns the form logic.

## Architecture

### Page structure (same for both pages)

```
<main> (full-screen, background: #0a0e1a)
  <StarField count={80} />       ← existing component, count lowered from default 150 for a sparser feel
  <div class="auth-container">  ← centered vertically + horizontally
    <AuthBrand />                ← new shared component
    <SignIn | SignUp />          ← Clerk component, card invisible
  </div>
</main>
```

### New component: `src/components/auth/AuthBrand.tsx`

Props: `tagline: string`

Renders:
- `BirdBot-Icon-mark1.svg` via Next.js `<Image>`, 48×48px, no animation, no glow rings
- "BirdBot" wordmark in `font-heading` (Outfit), 20px, weight 700
- `tagline` in 13px, `color: #64748b`

Sign-in uses tagline `"Sign in to continue"`, sign-up uses `"Create your account"`.

### Updated: `src/lib/clerk-appearance.ts`

Card element overrides change to:
```ts
card: {
  background: "transparent",
  border: "none",
  boxShadow: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  padding: 0,
}
```

Header title and subtitle hidden:
```ts
headerTitle: { display: "none" },
headerSubtitle: { display: "none" },
```

Input fields updated to subtle-fill:
```ts
formFieldInput: {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid #1e2a45",
  color: "#f1f5f9",
  borderRadius: "6px",
}
```

Social buttons get the same subtle-fill treatment:
```ts
socialButtonsBlockButton: {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid #1e2a45",
  color: "#f1f5f9",
}
```

All other `clerkAppearance` values (colors, link colors, text colors) remain unchanged.

### Updated: sign-in and sign-up page files

**Remove:**
- Radial spotlight `<div>`
- Floating bird icon + all glow ring `<div>`s
- `mb-6` logo section wrapper

**Replace with:**
- `<AuthBrand tagline="..." />`
- `<SignIn appearance={clerkAppearance} />` (same as before, just the appearance changes handle the rest)

## What Changes, What Stays

| Item | Change |
|---|---|
| `StarField` component | Reused as-is, added behind the form |
| `clerkAppearance.ts` | Card stripped, header hidden, inputs restyled |
| `sign-in/page.tsx` | Simplified — remove decorations, add AuthBrand |
| `sign-up/page.tsx` | Same as sign-in |
| `AuthBrand.tsx` | New shared component |
| `globals.css` | No changes needed |
| Clerk auth logic | Untouched |

## Testing

Manual smoke test after implementation:
- `/sign-in`: card chrome gone, star field visible, fields render with subtle fill, social button present, sign-in flow completes
- `/sign-up`: same checks, tagline reads "Create your account"
- Mobile: form centered and readable at 375px

No automated tests required for a layout-only change.
