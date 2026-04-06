'use client'
import { useEffect, useRef } from 'react'
import { useSignIn, useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function SSOCallbackPage() {
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const router = useRouter()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    async function handle() {
      const navigate = ({ decorateUrl }: { decorateUrl: (url: string) => string }) => {
        const url = decorateUrl('/dashboard')
        if (url.startsWith('http')) window.location.href = url
        else router.push(url)
      }

      // Sign-in complete
      if (signIn?.status === 'complete') {
        await signIn.finalize({ navigate })
        return
      }

      // New Google user — transfer sign-up to sign-in if account already exists
      if (signUp?.isTransferable) {
        const { error } = await signIn.create({ transfer: true })
        if (!error) {
          await signIn.finalize({ navigate })
        }
        return
      }

      // Sign-up complete (brand new account via Google)
      if (signUp?.status === 'complete') {
        await signUp.finalize({ navigate })
      }
    }

    handle()
  }, [signIn, signUp, router])

  return (
    <main className="relative min-h-screen flex items-center justify-center">
      <div id="clerk-captcha" />
      <p className="text-text-dim text-sm">Completing sign in…</p>
    </main>
  )
}
