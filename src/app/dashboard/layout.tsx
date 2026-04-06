import { Sidebar } from "@/components/dashboard/Sidebar"
import { AgentSetupWizard } from "@/components/dashboard/AgentSetupWizard"
import { SettingsModal } from "@/components/dashboard/SettingsModal"
import { AccountModal } from "@/components/dashboard/AccountModal"
import { WizardProvider } from "@/components/dashboard/WizardContext"
import { IncubatingGate } from "@/components/dashboard/IncubatingGate"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WizardProvider>
      <div className="min-h-screen bg-depth flex">
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen">
          <IncubatingGate>{children}</IncubatingGate>
        </main>
        <AgentSetupWizard />
        <SettingsModal />
        <AccountModal />
      </div>
    </WizardProvider>
  )
}
