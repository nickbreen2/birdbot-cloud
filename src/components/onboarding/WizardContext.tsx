"use client"

import { createContext, useContext, useState } from "react"

interface WizardContextType {
  forceOpen: boolean
  setForceOpen: (open: boolean) => void
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  accountOpen: boolean
  setAccountOpen: (open: boolean) => void
}

const WizardContext = createContext<WizardContextType>({
  forceOpen: false,
  setForceOpen: () => {},
  settingsOpen: false,
  setSettingsOpen: () => {},
  accountOpen: false,
  setAccountOpen: () => {},
})

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [forceOpen, setForceOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  return (
    <WizardContext.Provider
      value={{
        forceOpen,
        setForceOpen,
        settingsOpen,
        setSettingsOpen,
        accountOpen,
        setAccountOpen,
      }}
    >
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  return useContext(WizardContext)
}
