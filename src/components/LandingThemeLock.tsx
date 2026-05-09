"use client"

import { useLayoutEffect } from "react"

// Forces landing pages to always show the original navy design, and
// restores the previous dashboard theme when navigating away.
export function LandingThemeLock() {
  useLayoutEffect(() => {
    const html = document.documentElement
    // Read from localStorage so cleanup always restores the real dashboard theme,
    // regardless of what the DOM says at mount time (ThemeProviderWrapper fires after us)
    const stored = localStorage.getItem("theme") || "dark"
    const previous =
      stored === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : stored
    html.setAttribute("data-theme", "landing")
    return () => {
      html.setAttribute("data-theme", previous)
    }
  }, [])
  return null
}
