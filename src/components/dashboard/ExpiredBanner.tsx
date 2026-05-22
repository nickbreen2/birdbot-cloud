"use client"

import { useState } from "react"

export function ExpiredBanner() {
  const [loading, setLoading] = useState(false)

  async function handleReactivate() {
    setLoading(true)
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="expired-banner">
      <span className="expired-banner__text">
        Your subscription has ended. Reactivate to keep BirdBot working for you.
      </span>
      <button
        onClick={handleReactivate}
        disabled={loading}
        className="expired-banner__btn"
      >
        {loading ? "Loading..." : "Reactivate"}
      </button>
    </div>
  )
}
