import { Sidebar } from "@/components/dashboard/Sidebar"
import { AgentSetupWizard } from "@/components/dashboard/AgentSetupWizard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-depth flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
      <AgentSetupWizard />
    </div>
  )
}
