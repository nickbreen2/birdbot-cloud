"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export function PricingButton({
  priceId,
  isPro,
}: {
  priceId: string
  isPro: boolean
}) {
  const [loading, setLoading] = useState(false)
  const { isSignedIn } = useAuth()
  const router = useRouter()

  async function handleClick() {
    if (!isSignedIn) {
      router.push("/sign-in")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full py-3 rounded-xl text-sm font-bold tracking-wide mb-2 transition-opacity ${
        loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      } ${
        isPro
          ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white"
          : "bg-blue-500/10 border border-blue-500/30 text-blue-bright"
      }`}
    >
      {loading ? "Redirecting..." : "Get Started"}
    </button>
  )
}
