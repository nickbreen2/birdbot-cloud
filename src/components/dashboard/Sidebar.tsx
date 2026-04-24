"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserMenu } from "@/components/dashboard/UserMenu"
import { Brain, Link2 } from "lucide-react"

const navItems = [
  { label: "Memory",       href: "/dashboard/memory",       icon: Brain },
  { label: "Integrations", href: "/dashboard/integrations", icon: Link2 },
]

export function Sidebar() {
  const pathname = usePathname()

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
        <UserMenu />
      </div>
    </aside>
  )
}
