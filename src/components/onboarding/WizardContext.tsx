"use client"

import { createContext, useContext, useState, useCallback } from "react"

interface WizardContextType {
  forceOpen: boolean
  setForceOpen: (open: boolean) => void
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  accountOpen: boolean
  setAccountOpen: (open: boolean) => void
  newProjectOpen: boolean
  setNewProjectOpen: (open: boolean) => void
  projectsVersion: number
  refreshProjects: () => void
}

const WizardContext = createContext<WizardContextType>({
  forceOpen: false,
  setForceOpen: () => {},
  settingsOpen: false,
  setSettingsOpen: () => {},
  accountOpen: false,
  setAccountOpen: () => {},
  newProjectOpen: false,
  setNewProjectOpen: () => {},
  projectsVersion: 0,
  refreshProjects: () => {},
})

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [forceOpen, setForceOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [projectsVersion, setProjectsVersion] = useState(0)

  const refreshProjects = useCallback(() => {
    setProjectsVersion((v) => v + 1)
  }, [])

  return (
    <WizardContext.Provider
      value={{
        forceOpen,
        setForceOpen,
        settingsOpen,
        setSettingsOpen,
        accountOpen,
        setAccountOpen,
        newProjectOpen,
        setNewProjectOpen,
        projectsVersion,
        refreshProjects,
      }}
    >
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  return useContext(WizardContext)
}
