// src/components/onboarding/OrbitPanel.tsx
import React from 'react'
import { OnboardingOrbitVisual } from './OnboardingOrbitVisual'

export function OrbitPanel({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{
      width: '50%',
      height: '100%',
      background: 'var(--theme-depth)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Atmospheric background glow */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 65% 50% at 50% 50%, rgba(37,99,235,0.13) 0%, transparent 65%), ' +
          'radial-gradient(ellipse 40% 35% at 70% 30%, rgba(125,211,252,0.06) 0%, transparent 60%)',
      }} />

      <div
        className={children ? 'hide-scrollbar' : undefined}
        style={{
          width: '78%',
          aspectRatio: '1 / 1.25',
          background: 'var(--theme-panel)',
          borderRadius: 18,
          position: 'relative',
          overflow: children ? 'auto' : 'hidden',
          display: 'flex',
          alignItems: children ? 'flex-start' : 'center',
          justifyContent: 'center',
          boxShadow: '0 0 0 1px var(--theme-border), 0 4px 6px rgba(0,0,0,0.2), 0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        {/* Grain overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")",
        }} />

        {/* Inner atmospheric glow */}
        <div aria-hidden style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 2,
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(37,99,235,0.12) 0%, transparent 70%)',
        }} />

        {children ? (
          <div style={{ position: 'relative', zIndex: 3, width: '100%', padding: '28px 24px' }}>
            {children}
          </div>
        ) : (
          <div style={{ position: 'relative', zIndex: 3, transform: 'scale(1.25)', transformOrigin: 'center center' }}>
            <OnboardingOrbitVisual />
          </div>
        )}

      </div>
    </div>
  )
}
