"use client"

import { useEffect, useState } from "react"
import { useTheme } from "@/components/ThemeProviderWrapper"
import { Sun, Moon, Monitor } from "lucide-react"

const MODES = [
  { id: "light",  icon: Sun,     label: "Light"  },
  { id: "dark",   icon: Moon,    label: "Dark"   },
  { id: "system", icon: Monitor, label: "System" },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return (
    <div style={{ padding: "6px 10px" }}>
      <div
        style={{
          background: "var(--theme-toggle-track)",
          borderRadius: "7px",
          padding: "3px",
          display: "flex",
          gap: "2px",
        }}
      >
        {MODES.map(({ id, icon: Icon, label }) => {
          const active = theme === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              style={{
                flex: 1,
                background: active ? "var(--theme-toggle-active)" : "transparent",
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.15)" : undefined,
                borderRadius: "5px",
                padding: "5px 0",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: active ? 600 : 500,
                color: active ? "var(--theme-toggle-text-active)" : "var(--theme-toggle-text)",
                transition: "all 0.15s ease",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={11} />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
