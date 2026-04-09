import { Sidebar } from "@/components/dashboard/Sidebar"
import { MobileHeader } from "@/components/dashboard/MobileHeader"
import { BottomTabBar } from "@/components/dashboard/BottomTabBar"
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
        <MobileHeader />
        <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0 pb-16 lg:pb-0">
          <IncubatingGate>{children}</IncubatingGate>
        </main>
        <BottomTabBar />
        <AgentSetupWizard />
        <SettingsModal />
        <AccountModal />
      </div>
    </WizardProvider>
  )
}
