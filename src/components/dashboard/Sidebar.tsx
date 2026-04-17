"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserMenu } from "@/components/dashboard/UserMenu"
import { MessageSquare, Layers, Plug, Settings } from "lucide-react"
import { useWizard } from "@/components/dashboard/WizardContext"

const navItems = [
  { label: "Projects", href: "/dashboard/projects", icon: Layers },
  { label: "Connect",  href: "/dashboard/connect",  icon: Plug },
  { label: "Chat",     href: "/dashboard/chat",     icon: MessageSquare },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { agents, agentsLoaded, setSettingsOpen } = useWizard()
  const activeAgent = agents[0] ?? null

  return (
    <aside className="fixed top-0 left-0 h-full w-64 hidden lg:flex flex-col bg-surface border-r border-border z-40">
      {/* Instance status (top slot, replaces logo) */}
      {agentsLoaded && activeAgent ? (
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Open BirdBot settings"
          className="px-3 py-2.5 mx-3 mt-3 rounded-xl bg-panel border border-border w-[calc(100%-1.5rem)] text-left hover:border-blue/40 hover:bg-panel/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0">
              {activeAgent.status === "incubating" ? (
                <span className="text-base leading-none">🥚</span>
              ) : (
                <img src="/BirdBot-Icon-mark2.svg" alt="" className="w-5 h-5" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-text-base font-sans uppercase tracking-wide truncate">
                {activeAgent.name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      activeAgent.status === "active" || activeAgent.status === "online"
                        ? "bg-green-400"
                        : "bg-slate-500"
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                      activeAgent.status === "active" || activeAgent.status === "online"
                        ? "bg-green-400"
                        : "bg-slate-500"
                    }`}
                  />
                </span>
                <p className="text-xs text-text-muted font-sans capitalize">
                  {activeAgent.status}
                </p>
              </div>
            </div>
          </div>
        </button>
      ) : (
        <div className="px-3 py-2.5 mx-3 mt-3 rounded-xl bg-panel border border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-border flex-shrink-0" />
            <span className="text-xs font-semibold text-text-dim font-sans uppercase tracking-wide">
              No Bird Instance
            </span>
          </div>
          <p className="text-xs text-text-muted font-sans">
            {agentsLoaded ? "Create your first Bird to get started" : "Loading…"}
          </p>
        </div>
      )}

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
        <UserMenu />
      </div>
    </aside>
  )
}
