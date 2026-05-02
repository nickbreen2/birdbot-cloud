"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserMenu } from "@/components/dashboard/UserMenu"
import { Brain, Link2, Building2 } from "lucide-react"

const navItems = [
  { label: "HQ",           href: "/dashboard",              icon: Building2, exact: true },
  { label: "Memory",       href: "/dashboard/memory",       icon: Brain },
  { label: "Integrations", href: "/dashboard/integrations", icon: Link2 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed top-0 left-0 h-full w-64 hidden lg:flex flex-col bg-surface border-r border-border z-40">
      {/* Profile */}
      <div className="px-3 pt-3 pb-3">
        <UserMenu />
      </div>

      <div className="border-t border-border mx-5" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-0.5">
        {navItems.map(({ label, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-sans border transition-colors ${
                active
                  ? "bg-blue/10 text-blue-bright border-blue/20"
                  : "border-transparent text-text-dim hover:text-text-base hover:bg-panel"
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
    </aside>
  )
}
