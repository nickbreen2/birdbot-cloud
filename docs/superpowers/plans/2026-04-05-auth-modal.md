# Auth Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace page redirects for sign-in/sign-up with an inline modal on the landing page, keeping the `/sign-in` and `/sign-up` routes intact.

**Architecture:** Extract the sign-in and sign-up form logic from the existing pages into `SignInForm` and `SignUpForm` components. A new `AuthModal` renders either form via a React portal (to escape the Navbar's stacking context). The Navbar replaces `<Link>` elements with state-controlled modal triggers. Pages become thin wrappers.

**Tech Stack:** Next.js 16, React 19, Clerk (`@clerk/nextjs` v7), Tailwind CSS v4, TypeScript

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/components/auth/SignInForm.tsx` | Sign-in form logic and markup; accepts optional `onSwitchMode` prop |
| Create | `src/components/auth/SignUpForm.tsx` | Sign-up form logic and markup; accepts optional `onSwitchMode` prop |
| Create | `src/components/auth/AuthModal.tsx` | Portal-based modal overlay; renders SignInForm or SignUpForm |
| Modify | `src/components/landing/Navbar.tsx` | Replace Link navigations with modal state triggers |
| Modify | `src/app/sign-in/[[...sign-in]]/page.tsx` | Thin wrapper around SignInForm |
| Modify | `src/app/sign-up/[[...sign-up]]/page.tsx` | Thin wrapper around SignUpForm |

---

## Task 1: Create SignInForm

**Files:**
- Create: `src/components/auth/SignInForm.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/auth/SignInForm.tsx
'use client'
import { useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SignInFormProps {
  onSwitchMode?: () => void
}

export function SignInForm({ onSwitchMode }: SignInFormProps) {
  const { signIn, errors, fetchStatus } = useSignIn()
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'verify'>('email')

  async function handleGoogle() {
    await signIn.sso({
      strategy: 'oauth_google',
      redirectCallbackUrl: '/sso-callback',
      redirectUrl: '/dashboard',
    })
  }

  async function handleEmail(formData: FormData) {
    const emailAddress = formData.get('email') as string
    const { error } = await signIn.emailCode.sendCode({ emailAddress })
    if (error) return
    setStep('verify')
  }

  async function handleVerify(formData: FormData) {
    const code = formData.get('code') as string
    const { error } = await signIn.emailCode.verifyCode({ code })
    if (error) return
    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl('/dashboard')
          if (url.startsWith('http')) window.location.href = url
          else router.push(url)
        },
      })
    }
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {errors?.global?.message && (
        <p className="text-red-400 text-sm text-center">{errors.global.message}</p>
      )}

      {step === 'email' ? (
        <>
          <h1 className="font-heading font-semibold text-xl text-text-base text-center">
            Sign in to BirdBot
          </h1>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={fetchStatus === 'fetching'}
            className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-text-base text-sm font-medium transition-colors duration-200 hover:border-blue-light/50 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#151c2e', border: '1px solid #1e2a45' }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: '#1e2a45' }} />
            <span className="text-text-muted text-xs">or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#1e2a45' }} />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleEmail(new FormData(e.currentTarget)) }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="signin-email" className="text-sm text-text-dim">Email</label>
              <input
                id="signin-email"
                name="email"
                type="email"
                required
                autoFocus
                className="rounded-xl px-4 py-3 text-text-base text-sm outline-none focus:ring-2 focus:ring-blue"
                style={{ backgroundColor: '#0f172a', border: '1px solid #1e2a45' }}
              />
              {errors?.fields?.email_address?.message && (
                <p className="text-red-400 text-xs">{errors.fields.email_address.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={fetchStatus === 'fetching'}
              className="w-full rounded-full py-3 font-heading font-semibold text-white transition-all duration-200 hover:scale-[1.015] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #3b82f6 100%)',
                boxShadow: '0 0 36px rgba(37,99,235,0.32), 0 2px 10px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)',
              }}
            >
              {fetchStatus === 'fetching' ? 'Sending…' : 'Continue with Email'}
            </button>
          </form>

          <p className="text-center text-sm text-text-dim">
            No account?{' '}
            {onSwitchMode ? (
              <button
                type="button"
                onClick={onSwitchMode}
                className="text-blue-light hover:underline"
              >
                Create one
              </button>
            ) : (
              <Link href="/sign-up" className="text-blue-light hover:underline">
                Create one
              </Link>
            )}
          </p>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1 text-center">
            <h1 className="font-heading font-semibold text-xl text-text-base">
              Check your email
            </h1>
            <p className="text-sm text-text-dim">Enter the code we sent you.</p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleVerify(new FormData(e.currentTarget)) }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="signin-code" className="text-sm text-text-dim">
                Verification code
              </label>
              <input
                id="signin-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                autoFocus
                className="rounded-xl px-4 py-3 text-text-base text-sm outline-none focus:ring-2 focus:ring-blue tracking-widest text-center"
                style={{ backgroundColor: '#0f172a', border: '1px solid #1e2a45' }}
              />
              {errors?.fields?.code?.message && (
                <p className="text-red-400 text-xs">{errors.fields.code.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={fetchStatus === 'fetching'}
              className="w-full rounded-full py-3 font-heading font-semibold text-white transition-all duration-200 hover:scale-[1.015] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #3b82f6 100%)',
                boxShadow: '0 0 36px rgba(37,99,235,0.32), 0 2px 10px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)',
              }}
            >
              {fetchStatus === 'fetching' ? 'Verifying…' : 'Verify Email'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setStep('email')}
            className="text-center text-sm text-text-dim hover:text-text-base transition-colors"
          >
            ← Back
          </button>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

Run from `birdbot-cloud/`:
```bash
npx tsc --noEmit
```
Expected: no errors relating to `SignInForm.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/SignInForm.tsx
git commit -m "feat: extract SignInForm component"
```

---

## Task 2: Create SignUpForm

**Files:**
- Create: `src/components/auth/SignUpForm.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/auth/SignUpForm.tsx
'use client'
import { useState } from 'react'
import { useSignIn, useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SignUpFormProps {
  onSwitchMode?: () => void
}

export function SignUpForm({ onSwitchMode }: SignUpFormProps) {
  const { signIn } = useSignIn()
  const { signUp, errors, fetchStatus } = useSignUp()
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'verify'>('email')

  async function handleGoogle() {
    await signIn.sso({
      strategy: 'oauth_google',
      redirectCallbackUrl: '/sso-callback',
      redirectUrl: '/dashboard',
    })
  }

  async function handleEmail(formData: FormData) {
    const emailAddress = formData.get('email') as string
    const { error } = await signUp.create({ emailAddress })
    if (error) return
    const { error: sendError } = await signUp.verifications.sendEmailCode()
    if (sendError) return
    setStep('verify')
  }

  async function handleVerify(formData: FormData) {
    const code = formData.get('code') as string
    const { error } = await signUp.verifications.verifyEmailCode({ code })
    if (error) return
    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl('/dashboard')
          if (url.startsWith('http')) window.location.href = url
          else router.push(url)
        },
      })
    }
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {errors?.global?.message && (
        <p className="text-red-400 text-sm text-center">{errors.global.message}</p>
      )}

      {step === 'email' ? (
        <>
          <h1 className="font-heading font-semibold text-xl text-text-base text-center">
            Create your BirdBot
          </h1>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={fetchStatus === 'fetching'}
            className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-text-base text-sm font-medium transition-colors duration-200 hover:border-blue-light/50 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#151c2e', border: '1px solid #1e2a45' }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: '#1e2a45' }} />
            <span className="text-text-muted text-xs">or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#1e2a45' }} />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleEmail(new FormData(e.currentTarget)) }}
            className="flex flex-col gap-4"
          >
            <div id="clerk-captcha" />

            <div className="flex flex-col gap-1">
              <label htmlFor="signup-email" className="text-sm text-text-dim">Email</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                autoFocus
                className="rounded-xl px-4 py-3 text-text-base text-sm outline-none focus:ring-2 focus:ring-blue"
                style={{ backgroundColor: '#0f172a', border: '1px solid #1e2a45' }}
              />
              {errors?.fields?.email_address?.message && (
                <p className="text-red-400 text-xs">{errors.fields.email_address.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={fetchStatus === 'fetching'}
              className="w-full rounded-full py-3 font-heading font-semibold text-white transition-all duration-200 hover:scale-[1.015] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #3b82f6 100%)',
                boxShadow: '0 0 36px rgba(37,99,235,0.32), 0 2px 10px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)',
              }}
            >
              {fetchStatus === 'fetching' ? 'Sending…' : 'Continue with Email'}
            </button>
          </form>

          <p className="text-center text-sm text-text-dim">
            Already have an account?{' '}
            {onSwitchMode ? (
              <button
                type="button"
                onClick={onSwitchMode}
                className="text-blue-light hover:underline"
              >
                Sign in
              </button>
            ) : (
              <Link href="/sign-in" className="text-blue-light hover:underline">
                Sign in
              </Link>
            )}
          </p>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1 text-center">
            <h1 className="font-heading font-semibold text-xl text-text-base">
              Check your email
            </h1>
            <p className="text-sm text-text-dim">Enter the code we sent you.</p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleVerify(new FormData(e.currentTarget)) }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="signup-code" className="text-sm text-text-dim">
                Verification code
              </label>
              <input
                id="signup-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                autoFocus
                className="rounded-xl px-4 py-3 text-text-base text-sm outline-none focus:ring-2 focus:ring-blue tracking-widest text-center"
                style={{ backgroundColor: '#0f172a', border: '1px solid #1e2a45' }}
              />
              {errors?.fields?.code?.message && (
                <p className="text-red-400 text-xs">{errors.fields.code.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={fetchStatus === 'fetching'}
              className="w-full rounded-full py-3 font-heading font-semibold text-white transition-all duration-200 hover:scale-[1.015] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #3b82f6 100%)',
                boxShadow: '0 0 36px rgba(37,99,235,0.32), 0 2px 10px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)',
              }}
            >
              {fetchStatus === 'fetching' ? 'Verifying…' : 'Verify Email'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setStep('email')}
            className="text-center text-sm text-text-dim hover:text-text-base transition-colors"
          >
            ← Back
          </button>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/SignUpForm.tsx
git commit -m "feat: extract SignUpForm component"
```

---

## Task 3: Slim down sign-in page

**Files:**
- Modify: `src/app/sign-in/[[...sign-in]]/page.tsx`

- [ ] **Step 1: Replace page contents**

Replace the entire file with:

```tsx
// src/app/sign-in/[[...sign-in]]/page.tsx
'use client'
import { AuthBrand } from '@/components/auth/AuthBrand'
import { SignInForm } from '@/components/auth/SignInForm'

export default function SignInPage() {
  return (
    <main className="relative flex flex-col sm:min-h-screen sm:items-center sm:justify-center sm:p-6">
      <div className="flex flex-col sm:items-center sm:gap-8 w-full sm:max-w-[440px]">

        <div className="hidden sm:flex justify-center">
          <AuthBrand />
        </div>

        <div className="auth-card min-h-screen sm:min-h-0 w-full p-6 sm:p-8 flex flex-col justify-center sm:justify-start gap-5 sm:gap-6">
          <div className="sm:hidden flex justify-center mb-1">
            <AuthBrand />
          </div>
          <SignInForm />
        </div>

      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Verify page still works in the browser**

Navigate to `http://localhost:3000/sign-in`. Confirm:
- Logo appears above the card (desktop) and inside the card (mobile)
- Google button, email input, "Continue with Email" button all render
- "No account? Create one" navigates to `/sign-up` (no `onSwitchMode` prop was passed)

- [ ] **Step 4: Commit**

```bash
git add src/app/sign-in/[[...sign-in]]/page.tsx
git commit -m "refactor: sign-in page is now a thin wrapper around SignInForm"
```

---

## Task 4: Slim down sign-up page

**Files:**
- Modify: `src/app/sign-up/[[...sign-up]]/page.tsx`

- [ ] **Step 1: Replace page contents**

Replace the entire file with:

```tsx
// src/app/sign-up/[[...sign-up]]/page.tsx
'use client'
import { AuthBrand } from '@/components/auth/AuthBrand'
import { SignUpForm } from '@/components/auth/SignUpForm'

export default function SignUpPage() {
  return (
    <main className="relative flex flex-col sm:min-h-screen sm:items-center sm:justify-center sm:p-6">
      <div className="flex flex-col sm:items-center sm:gap-8 w-full sm:max-w-[440px]">

        <div className="hidden sm:flex justify-center">
          <AuthBrand />
        </div>

        <div className="auth-card min-h-screen sm:min-h-0 w-full p-6 sm:p-8 flex flex-col justify-center sm:justify-start gap-5 sm:gap-6">
          <div className="sm:hidden flex justify-center mb-1">
            <AuthBrand />
          </div>
          <SignUpForm />
        </div>

      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Verify page still works in the browser**

Navigate to `http://localhost:3000/sign-up`. Confirm:
- Renders identically to before
- "Already have an account? Sign in" navigates to `/sign-in`

- [ ] **Step 4: Commit**

```bash
git add src/app/sign-up/[[...sign-up]]/page.tsx
git commit -m "refactor: sign-up page is now a thin wrapper around SignUpForm"
```

---

## Task 5: Create AuthModal

**Files:**
- Create: `src/components/auth/AuthModal.tsx`

**Why a portal:** The Navbar is `position: fixed; z-index: 50`, which creates a stacking context. A child element can never visually escape that context regardless of its own z-index. `createPortal` renders the modal directly into `document.body`, outside the stacking context entirely.

- [ ] **Step 1: Create the file**

```tsx
// src/components/auth/AuthModal.tsx
'use client'
import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'

interface AuthModalProps {
  mode: 'sign-in' | 'sign-up'
  onClose: () => void
  onSwitchMode: (mode: 'sign-in' | 'sign-up') => void
}

export function AuthModal({ mode, onClose, onSwitchMode }: AuthModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        className="auth-card rounded-2xl glow-border-blue w-full max-w-[440px] p-6 sm:p-8 flex flex-col gap-5 sm:gap-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {mode === 'sign-in' ? (
          <SignInForm onSwitchMode={() => onSwitchMode('sign-up')} />
        ) : (
          <SignUpForm onSwitchMode={() => onSwitchMode('sign-in')} />
        )}
      </div>
    </div>,
    document.body
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/AuthModal.tsx
git commit -m "feat: add AuthModal portal component"
```

---

## Task 6: Wire AuthModal into Navbar

**Files:**
- Modify: `src/components/landing/Navbar.tsx`

- [ ] **Step 1: Replace Navbar contents**

Replace the entire file with:

```tsx
// src/components/landing/Navbar.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useCallback } from "react"
import { useAuth, SignOutButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/Button"
import { AuthModal } from "@/components/auth/AuthModal"

const NAV_LINKS = [
  { label: "How We Differ", href: "#how-we-differ" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [signOutHover, setSignOutHover] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const { isLoaded, isSignedIn } = useAuth()

  const openModal = useCallback((mode: 'sign-in' | 'sign-up') => {
    setModalMode(mode)
    setModalOpen(true)
    setOpen(false) // close mobile menu if open
  }, [])

  const closeModal = useCallback(() => setModalOpen(false), [])

  const switchMode = useCallback((mode: 'sign-in' | 'sign-up') => {
    setModalMode(mode)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* ── Glass pill ── */}
      <div
        className="mx-4 mt-3 rounded-2xl border border-border px-4 sm:px-6 py-3 flex items-center justify-between max-w-full"
        style={{
          background: "rgba(10, 14, 26, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <Image
            src="/birdbot-full-logo-mark2.svg"
            alt="BirdBot"
            width={133}
            height={32}
            priority
            className="w-[108px] sm:w-[133px]"
            style={{ height: "auto" }}
          />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="text-sm text-text-dim hover:text-text-base transition-colors font-sans"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA — auth-aware */}
        {isLoaded && isSignedIn ? (
          <div className="hidden md:flex items-center gap-3">
            <SignOutButton>
              <button
                className="text-sm font-sans transition-colors"
                style={{ color: signOutHover ? "#f1f5f9" : "#94a3b8" }}
                onMouseEnter={() => setSignOutHover(true)}
                onMouseLeave={() => setSignOutHover(false)}
              >
                Sign out
              </button>
            </SignOutButton>
            <Link href="/dashboard">
              <button
                className="text-sm px-4 py-2 rounded-lg font-sans flex items-center gap-1.5 transition-colors hover:opacity-90"
                style={{
                  background: "#151c2e",
                  border: "1px solid #1e2a45",
                  color: "#f1f5f9",
                }}
              >
                Dashboard <span>→</span>
              </button>
            </Link>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => openModal('sign-in')}
              className="text-sm font-sans transition-colors"
              style={{ color: "#94a3b8" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
            >
              Sign In
            </button>
            <Button size="sm" onClick={() => openModal('sign-up')}>
              Get Started
            </Button>
          </div>
        )}

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 flex-shrink-0"
          style={{
            color: "#ffffff",
            background: open ? "rgba(37,99,235,0.70)" : "rgba(37,99,235,0.35)",
            border: "1px solid rgba(59,130,246,0.55)",
          }}
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Mobile dropdown menu ── */}
      {open && (
        <div
          className="md:hidden mx-3 sm:mx-4 mt-1.5 rounded-2xl border border-border"
          style={{
            background: "rgba(10, 14, 26, 0.96)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <nav className="flex flex-col p-3 gap-0.5">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="text-sm text-text-dim hover:text-text-base transition-colors font-sans px-3 py-2.5 rounded-xl hover:bg-panel"
              >
                {label}
              </a>
            ))}
            <div className="mt-2 pt-2 border-t border-border px-1 flex flex-col gap-2">
              {isLoaded && isSignedIn ? (
                <>
                  <SignOutButton>
                    <button
                      className="w-full text-sm text-left px-3 py-2.5 rounded-xl font-sans transition-colors text-text-dim hover:text-text-base hover:bg-panel"
                      onClick={() => setOpen(false)}
                    >
                      Sign out
                    </button>
                  </SignOutButton>
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    <button
                      className="w-full text-sm px-3 py-2.5 rounded-xl font-sans flex items-center justify-between transition-colors hover:opacity-90"
                      style={{
                        background: "#151c2e",
                        border: "1px solid #1e2a45",
                        color: "#f1f5f9",
                      }}
                    >
                      Dashboard <span>→</span>
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openModal('sign-in')}
                    className="w-full text-sm text-left px-3 py-2.5 rounded-xl font-sans transition-colors text-text-dim hover:text-text-base hover:bg-panel"
                  >
                    Sign In
                  </button>
                  <Button size="sm" className="w-full justify-center" onClick={() => openModal('sign-up')}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* ── Auth Modal ── */}
      {modalOpen && (
        <AuthModal
          mode={modalMode}
          onClose={closeModal}
          onSwitchMode={switchMode}
        />
      )}
    </header>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Verify modal behaviour in the browser**

Start dev server (`npm run dev`) and confirm:

1. "Sign In" button on desktop → modal opens showing sign-in form; email input is focused
2. "Get Started" button on desktop → modal opens showing sign-up form
3. "No account? Create one" inside sign-in modal → switches to sign-up form (no page navigation)
4. "Already have an account? Sign in" inside sign-up modal → switches to sign-in form
5. Click backdrop → modal closes
6. Press Escape → modal closes
7. Mobile: hamburger → "Sign In" / "Get Started" open the modal; mobile menu closes
8. Visit `/sign-in` directly → page works as before (no modal, logo visible)
9. Visit `/sign-up` directly → page works as before

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/Navbar.tsx
git commit -m "feat: sign-in/sign-up open as modal on landing page"
```
