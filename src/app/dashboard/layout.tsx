import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { BottomTabBar } from "@/components/dashboard/BottomTabBar"
import { SettingsModal } from "@/components/dashboard/SettingsModal"
import { AccountModal } from "@/components/dashboard/AccountModal"
import { WizardProvider } from "@/components/onboarding/WizardContext"
import { ExpiredBanner } from "@/components/dashboard/ExpiredBanner"
import { ConnectGuidePopup } from "@/components/dashboard/ConnectGuidePopup"
import { prisma } from "@/lib/prisma"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const email = user.emailAddresses[0]?.emailAddress ?? null
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)
  const isAdmin = email && adminEmails.includes(email)

  let isExpired = false

  if (!isAdmin) {
    const subscription = await prisma.subscription.findUnique({
      where: { clerkUserId: user.id },
      select: { status: true, currentPeriodEnd: true },
    })

    // Never subscribed — send back to landing
    if (!subscription) redirect("/")

    const isActive =
      (subscription.status === "active" || subscription.status === "trialing") &&
      subscription.currentPeriodEnd > new Date()

    isExpired = !isActive
  }

  return (
    <WizardProvider>
      <div className="min-h-screen bg-depth flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64 lg:h-screen overflow-y-auto hide-scrollbar dashboard-main flex flex-col">
          {isExpired && <ExpiredBanner />}
          <ConnectGuidePopup />
          {children}
        </main>
        <BottomTabBar />
        <SettingsModal />
        <AccountModal />
      </div>
    </WizardProvider>
  )
}
