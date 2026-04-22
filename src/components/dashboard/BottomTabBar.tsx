"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, Layers, Network, Plug, Link2 } from "lucide-react"

const tabs = [
  { label: "Projects",     href: "/dashboard/projects",     icon: Layers },
  { label: "Chat",         href: "/dashboard/chat",         icon: MessageSquare },
  { label: "MCP",          href: "/dashboard/connect",      icon: Plug },
  { label: "Graph",        href: "/dashboard/graph",        icon: Network },
  { label: "Integrations", href: "/dashboard/integrations", icon: Link2 },
]

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      {tabs.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 text-[11px] font-sans transition-colors ${
              active ? "text-blue-bright" : "text-text-muted hover:text-text-dim"
            }`}
          >
            <Icon size={22} className={active ? "text-blue-bright" : "text-text-muted"} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
