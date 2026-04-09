"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MessageSquare, Plug, BarChart2, CreditCard,
  MoreHorizontal, Cpu, Wrench, LifeBuoy, Coins, Gift, X,
} from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/Badge"

const primaryTabs = [
  { label: "Chat",         href: "/dashboard/chat",         icon: MessageSquare },
  { label: "Integrations", href: "/dashboard/integrations", icon: Plug },
  { label: "Usage",        href: "/dashboard/usage",        icon: BarChart2 },
  { label: "Plan",         href: "/dashboard/plan",         icon: CreditCard },
]

const moreItems = [
  { label: "AI Models",         href: "/dashboard/models",  icon: Cpu,      iconColor: "" },
  { label: "Skills",            href: "/dashboard/skills",  icon: Wrench,   iconColor: "" },
  { label: "Support",           href: "/dashboard/support", icon: LifeBuoy, iconColor: "" },
  { label: "Set Up AI Credits", href: "/dashboard/models",  icon: Coins,    iconColor: "text-gold" },
  { label: "Refer & Earn",      href: "#",                  icon: Gift,     iconColor: "text-blue-bright", badge: "NEW" },
] as const

export function BottomTabBar() {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  const moreActive = moreItems.some(
    ({ href, label }) =>
      label !== "Refer & Earn" &&
      (pathname === href || pathname.startsWith(href + "/")),
  )

  return (
    <>
      {/* Sheet backdrop */}
      {sheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* More sheet */}
      {sheetOpen && (
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-surface border-t border-border px-4 pt-4"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted font-sans uppercase tracking-wide">
              More
            </span>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="text-text-muted hover:text-text-base transition-colors"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex flex-col gap-0.5 pb-2">
            {moreItems.map((item) => {
              const { label, href, icon: Icon, iconColor } = item
              const badge = "badge" in item ? item.badge : undefined
              const active = pathname === href || pathname.startsWith(href + "/")
              return (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setSheetOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-sans transition-all ${
                    active
                      ? "bg-blue/10 text-blue-bright border border-blue/20"
                      : "text-text-dim hover:text-text-base hover:bg-panel"
                  }`}
                >
                  <Icon
                    size={18}
                    className={active ? "text-blue-bright" : (iconColor || "text-text-muted")}
                  />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <Badge variant="blue" className="text-[10px] px-1.5 py-0">
                      {badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Fixed bottom tab bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile navigation"
      >
        {primaryTabs.map(({ label, href, icon: Icon }) => {
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
        <button
          type="button"
          onClick={() => setSheetOpen((v) => !v)}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 text-[11px] font-sans transition-colors ${
            moreActive ? "text-blue-bright" : "text-text-muted hover:text-text-dim"
          }`}
          aria-label="More navigation options"
        >
          <MoreHorizontal size={22} className={moreActive ? "text-blue-bright" : "text-text-muted"} />
          More
        </button>
      </nav>
    </>
  )
}
