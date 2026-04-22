"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserMenu } from "@/components/dashboard/UserMenu"
import { MessageSquare, Layers, Network, Coins, Gift, Plug, Link2 } from "lucide-react"
import { useWizard } from "@/components/onboarding/WizardContext"

const navItems = [
  { label: "Projects", href: "/dashboard/projects", icon: Layers },
  { label: "Chat",     href: "/dashboard/chat",     icon: MessageSquare },
  { label: "MCP",      href: "/dashboard/connect",  icon: Plug },
  { label: "Graph",        href: "/dashboard/graph",        icon: Network },
  { label: "Integrations", href: "/dashboard/integrations", icon: Link2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const { setSettingsOpen } = useWizard()

  return (
    <aside className="fixed top-0 left-0 h-full w-64 hidden lg:flex flex-col bg-surface border-r border-border z-40">
      {/* Logo slot */}
      <div className="px-3 py-2.5 mx-3 mt-3 rounded-xl bg-panel border border-border flex items-center gap-3">
        <img src="/BirdBot-Icon-mark2.svg" alt="" className="w-6 h-6 flex-shrink-0" />
        <span className="text-xs font-semibold text-text-base font-sans uppercase tracking-wide">
          BirdBot
        </span>
      </div>

      <div className="mt-3 border-t border-border" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-sans transition-all ${
                active
                  ? "bg-blue/10 text-blue-bright border border-blue/20"
                  : "text-text-dim hover:text-text-base hover:bg-panel"
              }`}
            >
              <Icon
                size={16}
                className={active ? "text-blue-bright" : "text-text-muted"}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-3 flex flex-col gap-1 border-t border-border pt-3">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-sans text-text-dim hover:text-text-base hover:bg-panel transition-colors w-full text-left">
          <Coins size={16} className="text-amber-400 flex-shrink-0" />
          Set Up AI Credits
        </button>
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-sans text-text-dim hover:text-text-base hover:bg-panel transition-colors w-full text-left">
          <Gift size={16} className="text-emerald-400 flex-shrink-0" />
          <span className="flex-1">Refer &amp; Earn</span>
          <span className="text-[10px] font-bold font-sans px-1.5 py-0.5 rounded-full bg-blue/20 text-blue-bright">NEW</span>
        </button>
        <UserMenu />
      </div>
    </aside>
  )
}
