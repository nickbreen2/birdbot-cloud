"use client"

import { useWizard } from "@/components/onboarding/WizardContext"

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen } = useWizard()

  if (!settingsOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,9,18,0.92)", backdropFilter: "blur(6px)" }}
      onClick={() => setSettingsOpen(false)}
    >
      <div
        className="w-full max-w-[480px] rounded-2xl border border-border p-8"
        style={{ background: "#111827" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold font-sans text-text-base">Settings</h2>
        <p className="text-sm text-text-muted font-sans mt-2">Coming soon.</p>
      </div>
    </div>
  )
}
