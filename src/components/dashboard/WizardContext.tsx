"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { CreateAgentPayload } from "@/types/wizard"

// Shape returned by GET /api/agents — matches the Prisma Agent model
export interface AgentData extends Omit<CreateAgentPayload, "createdAt"> {
  id: string
  clerkUserId: string
  status: string
  createdAt: string
  updatedAt: string
}

interface WizardContextType {
  forceOpen: boolean
  setForceOpen: (open: boolean) => void
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  accountOpen: boolean
  setAccountOpen: (open: boolean) => void
  agents: AgentData[]
  onboarded: boolean
  agentsLoaded: boolean
  refreshAgents: () => void
}

const WizardContext = createContext<WizardContextType>({
  forceOpen: false,
  setForceOpen: () => {},
  settingsOpen: false,
  setSettingsOpen: () => {},
  accountOpen: false,
  setAccountOpen: () => {},
  agents: [],
  onboarded: false,
  agentsLoaded: false,
  refreshAgents: () => {},
})

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [forceOpen, setForceOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [agents, setAgents] = useState<AgentData[]>([])
  const [onboarded, setOnboarded] = useState(false)
  const [agentsLoaded, setAgentsLoaded] = useState(false)

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents")
      if (!res.ok) return
      const data = (await res.json()) as { agents: AgentData[]; onboarded: boolean }
      setAgents(data.agents)
      setOnboarded(data.onboarded)
    } finally {
      setAgentsLoaded(true)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  return (
    <WizardContext.Provider
      value={{ forceOpen, setForceOpen, settingsOpen, setSettingsOpen, accountOpen, setAccountOpen, agents, onboarded, agentsLoaded, refreshAgents: fetchAgents }}
    >
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  return useContext(WizardContext)
}
