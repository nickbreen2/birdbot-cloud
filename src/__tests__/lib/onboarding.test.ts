import { describe, it, expect } from 'vitest'
import { getOnboardingRedirect } from '@/lib/onboarding'

describe('getOnboardingRedirect', () => {
  it('returns sign-in for unauthenticated user on protected route', () => {
    expect(getOnboardingRedirect('/dashboard', null, {})).toBe('sign-in')
  })

  it('redirects /dashboard to /onboarding when onboardingComplete is false', () => {
    expect(getOnboardingRedirect('/dashboard', 'user_1', { onboardingComplete: false })).toBe('onboarding')
  })

  it('redirects /dashboard/memory to /onboarding when onboardingComplete is false', () => {
    expect(getOnboardingRedirect('/dashboard/memory', 'user_1', { onboardingComplete: false })).toBe('onboarding')
  })

  it('allows /dashboard when onboardingComplete is true', () => {
    expect(getOnboardingRedirect('/dashboard', 'user_1', { onboardingComplete: true })).toBeNull()
  })

  it('allows /dashboard when onboardingComplete is undefined (existing users bypass guard)', () => {
    expect(getOnboardingRedirect('/dashboard', 'user_1', {})).toBeNull()
  })

  it('redirects /onboarding to /dashboard when onboardingComplete is true', () => {
    expect(getOnboardingRedirect('/onboarding', 'user_1', { onboardingComplete: true })).toBe('dashboard')
  })

  it('allows /onboarding when onboardingComplete is false', () => {
    expect(getOnboardingRedirect('/onboarding', 'user_1', { onboardingComplete: false })).toBeNull()
  })

  it('allows /onboarding when onboardingComplete is undefined (new user starting flow)', () => {
    expect(getOnboardingRedirect('/onboarding', 'user_1', {})).toBeNull()
  })
})
