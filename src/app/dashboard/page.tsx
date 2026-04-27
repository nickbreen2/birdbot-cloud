"use client"

import Link from "next/link"
import { useUser } from "@clerk/nextjs"

export default function DashboardPage() {
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress

  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center px-4">
      <span className="egg-shake text-8xl select-none" role="img" aria-label="egg">
        🥚
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold text-text-base">
          Your Birdbot is Incubating
        </h1>
        <p className="text-text-dim text-base">
          We&apos;ll notify you at{" "}
          <span className="text-text-base font-medium">{email}</span>
          {" "}when it&apos;s hatched.
        </p>
      </div>
      <Link href="/" className="flex items-center gap-1.5 text-text-muted text-sm hover:text-text-dim transition-colors">
        ← Return home
      </Link>
    </div>
  )
}
