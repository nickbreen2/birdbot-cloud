"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  resolvedTheme: "light" | "dark"
  systemTheme: "light" | "dark"
  themes: Theme[]
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  resolvedTheme: "dark",
  systemTheme: "dark",
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

export function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark")
  const [sys, setSys] = useState<"light" | "dark">("dark")

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme) || "dark"
    const system = getSystem()
    setSys(system)
    setThemeState(stored)
    apply(stored, system)

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = (e: MediaQueryListEvent) => {
      const newSys: "light" | "dark" = e.matches ? "dark" : "light"
      setSys(newSys)
      const current = (localStorage.getItem("theme") as Theme) || "dark"
      if (current === "system") apply("system", newSys)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

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
