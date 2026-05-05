"use client"

import { useEffect } from "react"

// Forces the landing page to always show the original navy design, and
// restores the previous dashboard theme when navigating away.
export function LandingThemeLock() {
  useEffect(() => {
    const html = document.documentElement
    const previous = html.getAttribute("data-theme")
    html.setAttribute("data-theme", "landing")
    return () => {
      if (previous) {
        html.setAttribute("data-theme", previous)
      } else {
        html.removeAttribute("data-theme")
      }
    }
  }, [])
  return null
}
