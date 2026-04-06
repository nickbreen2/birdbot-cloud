import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Simple per-IP rate limiter — 5 submissions per hour per IP.
// Resets on serverless cold starts, which is acceptable for a v1 waitlist.
const ipLog = new Map<string, number[]>()
const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_PER_WINDOW = 5

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (ipLog.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) return true
  recent.push(now)
  ipLog.set(ip, recent)
  return false
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests — try again later." },
      { status: 429 }
    )
  }

  try {
    const { email } = (await request.json()) as { email?: string }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    await prisma.waitlistEntry.upsert({
      where: { email },
      update: {}, // already subscribed — do nothing
      create: { email },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[/api/waitlist] Error:", err)
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
