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
      {errors?.global?.[0]?.message && (
        <p className="text-red-400 text-sm text-center">{errors.global[0].message}</p>
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
              {errors?.fields?.identifier?.message && (
                <p className="text-red-400 text-xs">{errors.fields.identifier.message}</p>
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
