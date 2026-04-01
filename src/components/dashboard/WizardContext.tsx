"use client"

import { createContext, useContext, useState } from "react"

interface WizardContextType {
  forceOpen: boolean
  setForceOpen: (open: boolean) => void
}

const WizardContext = createContext<WizardContextType>({
  forceOpen: false,
  setForceOpen: () => {},
})

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [forceOpen, setForceOpen] = useState(false)
  return (
    <WizardContext.Provider value={{ forceOpen, setForceOpen }}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  return useContext(WizardContext)
}
