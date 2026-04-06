'use client'
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export default function SSOCallbackPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center">
      <div id="clerk-captcha" />
      <p className="text-text-dim text-sm">Completing sign in…</p>
      <AuthenticateWithRedirectCallback signInForceRedirectUrl="/dashboard" signUpForceRedirectUrl="/dashboard" />
    </main>
  )
}
