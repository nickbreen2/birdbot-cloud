import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import type { ReactNode } from 'react'

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const user = await currentUser()
  if (user) {
    const email = user.emailAddresses[0]?.emailAddress ?? ''
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean)
    if (adminEmails.includes(email)) redirect('/dashboard')
  }
  return <>{children}</>
}
