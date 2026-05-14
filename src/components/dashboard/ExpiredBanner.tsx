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
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(239,68,68,0.08)",
        borderBottom: "1px solid rgba(239,68,68,0.2)",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        backdropFilter: "blur(8px)",
      }}
    >
      <span style={{ fontSize: 13, color: "rgba(252,165,165,0.9)", lineHeight: 1.4 }}>
        Your subscription has ended. Reactivate to keep BirdBot working for you.
      </span>
      <button
        onClick={handleReactivate}
        disabled={loading}
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#fff",
          background: "rgba(239,68,68,0.5)",
          border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: 6,
          padding: "6px 14px",
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.7 : 1,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {loading ? "Loading..." : "Reactivate"}
      </button>
    </div>
  )
}
