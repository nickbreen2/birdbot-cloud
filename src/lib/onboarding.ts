export function getOnboardingRedirect(
  pathname: string,
  userId: string | null,
  claims: Record<string, unknown>
): 'sign-in' | 'onboarding' | 'dashboard' | null {
  if (!userId) return 'sign-in'
  const done = claims.onboardingComplete
  if (pathname.startsWith('/dashboard') && done === false) return 'onboarding'
  if (pathname.startsWith('/onboarding') && done === true) return 'dashboard'
  return null
}
