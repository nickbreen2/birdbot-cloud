import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { BottomTabBar } from "@/components/dashboard/BottomTabBar"
import { SettingsModal } from "@/components/dashboard/SettingsModal"
import { AccountModal } from "@/components/dashboard/AccountModal"
import { WizardProvider } from "@/components/onboarding/WizardContext"
import { isSubscribed } from "@/lib/subscription"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const email = user.emailAddresses[0]?.emailAddress ?? null
  const subscribed = await isSubscribed(user.id, email)
  if (!subscribed) redirect("/")

  return (
    <WizardProvider>
      <div className="min-h-screen bg-depth flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64 lg:h-screen overflow-y-auto hide-scrollbar dashboard-main flex flex-col">
          {children}
        </main>
        <BottomTabBar />
        <SettingsModal />
        <AccountModal />
      </div>
    </WizardProvider>
  )
}
