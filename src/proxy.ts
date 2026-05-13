import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server'
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

  const { userId, sessionClaims, redirectToSignIn } = await auth()

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: request.url })
  }

  // onboardingComplete is injected into the JWT by the Clerk session token template.
  // All users — including pre-onboarding accounts (undefined) — must complete onboarding.
  const claims = (sessionClaims ?? {}) as Record<string, unknown>

  if (isDashboard(request) && claims.onboardingComplete !== true) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean)

    if (adminEmails.length > 0) {
      const clerk = await clerkClient()
      const user = await clerk.users.getUser(userId)
      const email = user.emailAddresses[0]?.emailAddress ?? ''
      if (adminEmails.includes(email)) {
        // Mark onboarding complete so future requests skip this API call
        await clerk.users.updateUserMetadata(userId, {
          publicMetadata: { onboardingComplete: true },
        })
        return NextResponse.next()
      }
    }

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
