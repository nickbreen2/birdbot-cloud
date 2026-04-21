"use client"

import { useWizard } from "@/components/onboarding/WizardContext"
import { NewProjectModal } from "@/components/dashboard/NewProjectModal"

export function NewProjectModalWrapper() {
  const { newProjectOpen, setNewProjectOpen, refreshProjects } = useWizard()

  if (!newProjectOpen) return null

  return (
    <NewProjectModal
      onClose={() => setNewProjectOpen(false)}
      onProjectCreated={refreshProjects}
    />
  )
}
