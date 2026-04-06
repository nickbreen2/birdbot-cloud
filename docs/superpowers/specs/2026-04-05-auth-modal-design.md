# Auth Modal Design

**Date:** 2026-04-05
**Status:** Approved

## Summary

Replace page redirects for sign-in and sign-up on the landing page with an inline modal popup. The `/sign-in` and `/sign-up` routes remain fully functional for direct URL access and email magic links.

---

## Architecture

### New files

| File | Purpose |
|------|---------|
| `src/components/auth/SignInForm.tsx` | Extracted sign-in form logic and markup |
| `src/components/auth/SignUpForm.tsx` | Extracted sign-up form logic and markup |
| `src/components/auth/AuthModal.tsx` | Modal overlay wrapping SignInForm / SignUpForm |

### Modified files

| File | Change |
|------|--------|
| `src/components/landing/Navbar.tsx` | Open modal instead of navigating to `/sign-in` / `/sign-up` |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Thin wrapper importing SignInForm |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | Thin wrapper importing SignUpForm |

---

## Components

### SignInForm

- Extracted verbatim from the current `sign-in/page.tsx`
- Accepts one optional prop: `onSwitchMode?: () => void`
- When `onSwitchMode` is provided, the "No account? Create one" link calls it instead of navigating to `/sign-up`
- When `onSwitchMode` is absent (page context), the link navigates as before
- No `AuthBrand` logo — the logo is a page-level concern, not a form concern

### SignUpForm

- Extracted verbatim from the current `sign-up/page.tsx`
- Accepts one optional prop: `onSwitchMode?: () => void`
- When `onSwitchMode` is provided, the "Already have an account? Sign in" link calls it instead of navigating to `/sign-in`
- When `onSwitchMode` is absent (page context), the link navigates as before
- Keeps the `<div id="clerk-captcha" />` element — Clerk mounts the CAPTCHA widget here; it must remain in the rendered form

### AuthModal

- Fixed overlay: semi-transparent dark backdrop (`bg-black/60`) with `backdrop-blur-sm`
- Centred card: reuses the existing `auth-card` class and styling from the pages
- Manages `mode: 'sign-in' | 'sign-up'` internally
- Initial mode is set by the prop passed in when the modal is opened
- Passes `onSwitchMode` to the active form so the user can toggle without closing
- Close behaviour:
  - Backdrop click closes modal
  - Escape key closes modal
  - No explicit close button (backdrop click is sufficient; keeps UI clean)
- No `AuthBrand` logo inside the modal (the landing page is already branded)

### Navbar changes

- Replaces `<Link href="/sign-in">` and `<Link href="/sign-up">` with buttons that call `openModal('sign-in')` / `openModal('sign-up')`
- Modal state (`isOpen`, `mode`) lives in Navbar — it is the only trigger on the landing page
- `AuthModal` is rendered inside `Navbar`'s JSX (or directly below the header, within the same component)
- Mobile menu: same buttons get the same modal trigger treatment; menu closes when modal opens

### Pages (unchanged behaviour)

- `sign-in/page.tsx` renders `<SignInForm />` inside the existing `auth-card` layout with `AuthBrand` logo — no `onSwitchMode` prop, so "Create one" link navigates normally
- `sign-up/page.tsx` renders `<SignUpForm />` inside the existing `auth-card` layout with `AuthBrand` logo — no `onSwitchMode` prop, so "Sign in" link navigates normally

---

## Data flow

```
Navbar
  ├── "Sign In" button  →  openModal('sign-in')
  ├── "Get Started" button  →  openModal('sign-up')
  └── AuthModal (rendered here)
        ├── mode = 'sign-in'  →  <SignInForm onSwitchMode={() => setMode('sign-up')} />
        └── mode = 'sign-up'  →  <SignUpForm onSwitchMode={() => setMode('sign-in')} />
```

On successful auth, both forms call `router.push('/dashboard')` — same as today, modal closes automatically because the page navigates away.

---

## Error handling

- Form-level errors are displayed inline as today (Clerk error fields)
- No special modal-level error handling needed — Clerk manages all auth errors within the form

---

## Accessibility

- Modal traps focus while open (use `autoFocus` on the first input)
- Escape key closes modal
- Backdrop has `aria-hidden="true"`; modal panel has `role="dialog"` and `aria-modal="true"`

---

## Out of scope

- Animating modal open/close (can be added later)
- Triggering the modal from sections other than the Navbar (e.g. hero CTA) — can follow the same pattern later by lifting state or using context
