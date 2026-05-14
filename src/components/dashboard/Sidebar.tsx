"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { UserMenu } from "@/components/dashboard/UserMenu"
import { Brain, Link2, Building2 } from "lucide-react"

const navItems = [
  { label: "HQ",           href: "/dashboard",              icon: Building2, exact: true },
  { label: "Memory",       href: "/dashboard/memory",       icon: Brain },
  { label: "Integrations", href: "/dashboard/integrations", icon: Link2 },
]

type BirdStatusState =
  | { state: "loading" }
  | { state: "connected"; service: string }
  | { state: "disconnected" }

function BirdStatus() {
  const [status, setStatus] = useState<BirdStatusState>({ state: "loading" })

  useEffect(() => {
    fetch("/api/telegram/status")
      .then(r => r.json())
      .then((d: { paired: boolean; displayName?: string }) => {
        setStatus(d.paired
          ? { state: "connected", service: "Telegram" }
          : { state: "disconnected" }
        )
      })
      .catch(() => setStatus({ state: "disconnected" }))
  }, [])

  const isConnected = status.state === "connected"
  const isLoading   = status.state === "loading"

  return (
    <div className="px-3 pb-5">
      <div
        style={{
          background: "var(--theme-surface)",
          border: "1px solid var(--theme-border)",
          borderRadius: "14px",
          padding: "14px 16px 16px",
        }}
      >
        <p
          className="text-[10px] font-medium uppercase mb-[10px]"
          style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: "0.12em", color: "var(--theme-text-muted)" }}
        >
          Bird Status
        </p>

        <div className="flex items-center" style={{ gap: "10px" }}>
          {isLoading ? (
            <div
              className="flex-shrink-0 rounded-full animate-pulse"
              style={{ width: 8, height: 8, background: "rgba(255,255,255,0.12)" }}
            />
          ) : (
            <div
              className={`flex-shrink-0 rounded-full${isConnected ? " animate-bird-pulse" : ""}`}
              style={{
                width: 8,
                height: 8,
                background: isConnected ? "#4ADE80" : "#3A3A3A",
                boxShadow: isConnected
                  ? "0 0 0 3px rgba(74,222,128,0.15), 0 0 12px rgba(74,222,128,0.45)"
                  : "none",
              }}
            />
          )}
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "-0.005em",
              color: isLoading ? "transparent" : isConnected ? "var(--theme-text-base)" : "var(--theme-text-muted)",
            }}
          >
            {isLoading ? "—" : isConnected ? "Connected" : "Not connected"}
          </span>
        </div>

        {isConnected && status.state === "connected" && (
          <p style={{ fontSize: 12, color: "var(--theme-text-muted)", marginTop: 6 }}>
            Connected via {status.service}
          </p>
        )}
      </div>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed top-0 left-0 h-full w-64 hidden lg:flex flex-col bg-depth border-r z-40" style={{ borderColor: "var(--theme-sidebar-border)" }}>
      {/* Profile */}
      <div className="px-3 pt-3 pb-2">
        <UserMenu />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pt-3 pb-3 flex flex-col gap-0.5">
        <p className="text-[9px] font-bold font-sans uppercase tracking-[0.12em] text-text-muted mb-1.5 px-2">
          Workspace
        </p>

        {navItems.map(({ label, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
          return (
            <div key={href} className="relative">
              {active && (
                <span
                  className="absolute left-0 top-[4px] bottom-[4px] w-[2px] rounded-r-full"
                  style={{ background: "var(--theme-nav-active-bar)" }}
                />
              )}
              <Link
                href={href}
                className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-sans transition-colors ${
                  active
                    ? "text-text-base"
                    : "text-text-dim hover:text-text-base hover:bg-[var(--theme-nav-hover-bg)]"
                }`}
                style={{
                  background: active ? "var(--theme-nav-active-bg)" : undefined,
                }}
              >
                <Icon
                  size={15}
                  className={active ? "text-text-base" : "text-text-muted transition-colors group-hover:text-text-base"}
                />
                {label}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Bird Status */}
      <BirdStatus />
    </aside>
  )
}
