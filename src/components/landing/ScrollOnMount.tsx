"use client"
import { useEffect } from "react"

export function ScrollOnMount() {
  useEffect(() => {
    const id = sessionStorage.getItem("scrollTo")
    if (!id) return
    sessionStorage.removeItem("scrollTo")
    const el = document.getElementById(id)
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100)
  }, [])
  return null
}
