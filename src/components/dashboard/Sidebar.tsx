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
      {/* Logo */}
      <div className="px-5 py-5">
        <span
          className="font-heading font-black select-none"
          style={{
            fontSize: "1.85rem",
            letterSpacing: "-0.04em",
            lineHeight: 1,
            background: "linear-gradient(155deg, #ffffff 0%, #e0f2fe 25%, #bae6fd 48%, #93c5fd 72%, #60a5fa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          BirdBot
        </span>
      </div>

      <div className="border-t border-border mx-5" />

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
