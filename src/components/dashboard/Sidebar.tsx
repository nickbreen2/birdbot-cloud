"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser, UserButton } from "@clerk/nextjs"
import {
  MessageSquare,
  Plug,
  BarChart2,
  Cpu,
  CreditCard,
  Wrench,
  LifeBuoy,
  Coins,
  Gift,
} from "lucide-react"
import { Badge } from "@/components/ui/Badge"

const navItems = [
  { label: "Chat",         href: "/dashboard/chat",         icon: MessageSquare },
  { label: "Integrations", href: "/dashboard/integrations", icon: Plug },
  { label: "Usage",        href: "/dashboard/usage",        icon: BarChart2 },
  { label: "AI Models",    href: "/dashboard/models",       icon: Cpu },
  { label: "Plan",         href: "/dashboard/plan",         icon: CreditCard },
  { label: "Skills",       href: "/dashboard/skills",       icon: Wrench },
  { label: "Support",      href: "/dashboard/support",      icon: LifeBuoy },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <aside className="fixed top-0 left-0 h-full w-64 flex flex-col bg-surface border-r border-border z-40">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 group w-fit">
          <img src="/birdbot-full-logo-mark2.svg" alt="BirdBot" className="h-7 w-auto" />
        </Link>
      </div>

      {/* Instance status */}
      <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-panel border border-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-border flex-shrink-0" />
          <span className="text-xs font-semibold text-text-dim font-sans uppercase tracking-wide">
            No Bird Instance
          </span>
        </div>
        <p className="text-xs text-text-muted font-sans">
          Create your first Bird to get started
        </p>
      </div>

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
        {/* Set up AI credits */}
        <Link
          href="/dashboard/models"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-sans text-text-dim hover:text-text-base hover:bg-panel transition-all"
        >
          <Coins size={16} className="text-gold" />
          <span>Set Up AI Credits</span>
        </Link>

        {/* Refer & Earn */}
        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-sans text-text-dim hover:text-text-base hover:bg-panel transition-all"
        >
          <Gift size={16} className="text-blue-bright" />
          <span className="flex-1">Refer &amp; Earn</span>
          <Badge variant="blue" className="text-[10px] px-1.5 py-0">NEW</Badge>
        </Link>

        {/* User profile */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl bg-panel border border-border">
          <UserButton />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-text-base font-sans truncate">
              {user?.firstName ?? user?.username ?? "User"}
            </span>
            <span className="text-xs text-text-muted font-sans truncate">
              {user?.primaryEmailAddress?.emailAddress ?? ""}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
