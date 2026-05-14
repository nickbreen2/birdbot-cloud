"use client"

import { createContext, useContext, useState } from "react"

interface WizardContextType {
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  accountOpen: boolean
  setAccountOpen: (open: boolean) => void
}

const WizardContext = createContext<WizardContextType>({
  settingsOpen: false,
  setSettingsOpen: () => {},
  accountOpen: false,
  setAccountOpen: () => {},
})

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  return (
    <WizardContext.Provider
      value={{
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
