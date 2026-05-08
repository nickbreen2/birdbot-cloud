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

  const { userId, sessionClaims, redirectToSignIn } = await auth()

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: request.url })
  }

  // onboardingComplete is injected into the JWT by the Clerk session token template.
  // Existing users (onboardingComplete === undefined) are NOT redirected — they bypass gracefully.
  const claims = (sessionClaims ?? {}) as Record<string, unknown>

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
