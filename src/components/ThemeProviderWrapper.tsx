"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { usePathname } from "next/navigation"

type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  resolvedTheme: "light" | "dark"
  systemTheme: "light" | "dark"
  themes: Theme[]
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  resolvedTheme: "light",
  systemTheme: "light",
  themes: ["light", "dark", "system"],
})

export function useTheme() {
  return useContext(ThemeContext)
}

function getSystem(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function apply(theme: Theme, sys: "light" | "dark") {
  const resolved = theme === "system" ? sys : theme
  document.documentElement.setAttribute("data-theme", resolved)
}

const DASH_PREFIXES = ["/dashboard", "/sign-in", "/sign-up", "/sso-callback", "/demo"]

export function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")
  const [sys, setSys] = useState<"light" | "dark">("light")
  const pathname = usePathname()

  // Set up system theme listener once
  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme) || "light"
    const system = getSystem()
    setSys(system)
    setThemeState(stored)

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = (e: MediaQueryListEvent) => {
      const newSys: "light" | "dark" = e.matches ? "dark" : "light"
      setSys(newSys)
      const current = (localStorage.getItem("theme") as Theme) || "light"
      if (current === "system") apply("system", newSys)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  // Re-apply correct data-theme on every route change
  useEffect(() => {
    const isDash = DASH_PREFIXES.some(p => pathname === p || pathname.startsWith(p + "/"))
    if (isDash) {
      const stored = (localStorage.getItem("theme") as Theme) || "light"
      apply(stored, sys)
    } else {
      // Onboarding, landing, and all other routes use the landing theme
      document.documentElement.setAttribute("data-theme", "landing")
    }
  }, [pathname, sys])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    try { localStorage.setItem("theme", t) } catch {}
    apply(t, sys)
  }, [sys])

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      resolvedTheme: theme === "system" ? sys : theme,
      systemTheme: sys,
      themes: ["light", "dark", "system"],
    }}>
      {children}
    </ThemeContext.Provider>
  )
}
