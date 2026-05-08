// src/components/onboarding/OnboardingShell.tsx
import React from 'react'
import { OrbitPanel, BirdIcon } from './OrbitPanel'

type Step = 1 | 2 | 3

function segClass(segIndex: number, activeStep: Step): string {
  if (segIndex < activeStep - 1) return 'done'
  if (segIndex === activeStep - 1) return 'on'
  return 'dim'
}

const segColors: Record<string, string> = {
  on:   '#2463EB',
  done: '#2463EB',
  dim:  '#C3D4FC',
}
const segOpacity: Record<string, number> = {
  on: 1, done: 0.45, dim: 1,
}

export function OnboardingShell({ step, children }: { step: Step; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#fff' }}>
      {/* Left panel */}
      <div style={{
        width: '50%',
        height: '100%',
        padding: '0 148px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        borderRight: '1px solid #EBEBEA',
        overflowY: 'auto',
      }}>
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, background: '#2463EB', borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(36,99,235,0.3)',
          }}>
            <BirdIcon size={18} color="white" />
          </div>
          <span style={{
            fontFamily: 'var(--font-bricolage, "Bricolage Grotesque", sans-serif)',
            fontSize: 16, fontWeight: 600, color: '#0D0D0D', letterSpacing: '-0.3px',
          }}>BirdBot</span>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 5, width: '100%', marginBottom: 32 }}>
          {[0, 1, 2].map(i => {
            const cls = segClass(i, step)
            return (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 99,
                background: segColors[cls],
                opacity: segOpacity[cls],
                transition: 'background 0.3s, opacity 0.3s',
              }} />
            )
          })}
        </div>

        {children}
      </div>

      {/* Right panel */}
      <OrbitPanel />
    </div>
  )
}
