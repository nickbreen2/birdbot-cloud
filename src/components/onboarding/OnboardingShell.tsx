// src/components/onboarding/OnboardingShell.tsx
"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { OrbitPanel } from './OrbitPanel'

type Step = 1 | 2 | 3

function segClass(segIndex: number, activeStep: Step): string {
  if (segIndex < activeStep - 1) return 'done'
  if (segIndex === activeStep - 1) return 'on'
  return 'dim'
}

const segColors: Record<string, string> = {
  on:   '#2463EB',
  done: '#2463EB',
  dim:  'rgba(255,255,255,0.15)',
}
const segOpacity: Record<string, number> = {
  on: 1, done: 0.5, dim: 1,
}

const STEP_ROUTES: Record<number, string> = {
  1: '/onboarding',
  2: '/onboarding/connect',
  3: '/onboarding/plan',
}

export function OnboardingShell({ step, children, rightContent }: { step: Step; children: React.ReactNode; rightContent?: React.ReactNode }) {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  function handleSegmentClick(segIndex: number) {
    const targetStep = segIndex + 1
    if (targetStep < step) {
      router.push(STEP_ROUTES[targetStep])
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--theme-depth)' }}>
      {/* Left panel */}
      <div className="ob-left">
        {/* Subtle atmospheric gradient top-left */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 55% at 20% 20%, rgba(37,99,235,0.07) 0%, transparent 65%)',
        }} />

        {/* Brand row */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'var(--font-outfit, "Outfit", sans-serif)',
              fontSize: 26, fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1, userSelect: 'none',
              background: 'linear-gradient(155deg, #ffffff 0%, #e0f2fe 25%, #bae6fd 48%, #93c5fd 72%, #60a5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              cursor: 'pointer',
            }}>BirdBot</span>
          </Link>
        </div>

        {/* Progress bar */}
        <div className="ob-progress">
          {[0, 1, 2].map(i => {
            const cls = segClass(i, step)
            const isBack = i + 1 < step
            return (
              <div
                key={i}
                onClick={() => handleSegmentClick(i)}
                style={{
                  flex: 1, height: 3, borderRadius: 99,
                  background: segColors[cls],
                  opacity: segOpacity[cls],
                  transition: 'background 0.3s, opacity 0.3s',
                  cursor: isBack ? 'pointer' : 'default',
                }}
              />
            )
          })}
        </div>

        <div style={{ position: 'relative' }}>
          {children}
        </div>

        {/* Mobile/tablet: payment form rendered inline below left content */}
        {isMobile && rightContent && (
          <div className="ob-mobile-payment">
            {rightContent}
          </div>
        )}
      </div>

      {/* Right panel — desktop only; gets rightContent only when not mobile */}
      <OrbitPanel step={step}>{isMobile ? undefined : rightContent}</OrbitPanel>
    </div>
  )
}
